from algopy import (
    ARC4Contract,
    BoxMap,
    Global,
    Txn,
    arc4,
    gtxn,
    itxn,
    op,
)
from algopy.arc4 import abimethod


# EventStruct definition
class EventStruct(arc4.Struct):
    """
    EventStruct

    Represents an event that can be used for conditional donations.
    This struct is stored in a BoxMap, allowing efficient lookup and update by event ID.

    Fields:
    - event_id: Unique identifier for the event
    - event_string: Description/name of the event
    - pending: Whether the event outcome is still pending
    - resolution: The outcome of the event (true/false) - only valid when pending=false
    - oracle_address: Address authorized to resolve this event
    """
    event_id: arc4.UInt64
    event_string: arc4.String
    pending: arc4.Bool
    resolution: arc4.Bool
    oracle_address: arc4.Address


class ConditionalClauseStruct(arc4.Struct):
    """
    ConditionalClauseStruct
    
    Represents a conditional donation clause: "If event resolves to X, send amount to recipient_yes, else send to recipient_no"
    
    Fields:
    - clause_id: Unique identifier for this clause
    - event_id: Reference to the event this clause depends on
    - payout_amount: Amount to be paid out (in microAlgos)
    - recipient_yes: Address to receive funds if event resolves to true
    - recipient_no: Address to receive funds if event resolves to false
    - donor_address: Address of the person who created this conditional clause
    - executed: Whether this clause has been executed
    """
    clause_id: arc4.UInt64
    event_id: arc4.UInt64
    payout_amount: arc4.UInt64
    recipient_yes: arc4.Address
    recipient_no: arc4.Address
    donor_address: arc4.Address
    executed: arc4.Bool


class ResponsiveDonation(ARC4Contract):
    """
    ResponsiveDonation Contract
    
    This smart contract supports:
    1. Instantaneous donations to recipient addresses
    2. Conditional donations that pay out based on external event resolution
    3. Event creation and resolution by authorized oracles
    
    Key features:
    - Direct donations with immediate payout
    - Conditional donations held in escrow until event resolution
    - Oracle-based event resolution system
    """
    
    def __init__(self) -> None:
        # BoxMap for events (key: event ID, value: EventStruct)
        self.listed_events = BoxMap(
            arc4.UInt64, 
            EventStruct,
            key_prefix="events"
        )
        
        # BoxMap for conditional clauses (key: clause ID, value: ConditionalClauseStruct)
        self.conditional_clauses = BoxMap(
            arc4.UInt64,
            ConditionalClauseStruct,
            key_prefix="clauses"
        )
    
    @abimethod()
    def create_event(
        self,
        event_string: arc4.String,
        oracle_address: arc4.Address
    ) -> arc4.UInt64:
        """
        Create a new event that can be used for conditional donations.
        
        Args:
            event_string: Description of the event (e.g., "Hurricane hits Miami")
            oracle_address: Address authorized to resolve this event
            
        Returns:
            The event ID of the created event (uint64)
        """
        # Use timestamp as unique event ID
        event_id = arc4.UInt64(Global.latest_timestamp)
        
        # Create and store the event struct
        self.listed_events[event_id] = EventStruct(
            event_id=event_id,
            event_string=event_string,
            pending=arc4.Bool(True),
            resolution=arc4.Bool(False),  # Default resolution, not meaningful until pending=false
            oracle_address=oracle_address
        )
        
        return event_id
    
    @abimethod()
    def instantaneous_payout(
        self,
        recipient_address: arc4.Address,
        payment: gtxn.PaymentTransaction
    ) -> bool:
        """
        Process an immediate donation with instant payout to recipient.
        
        Args:
            recipient_address: Address to receive the donation
            payment: The payment transaction (must be grouped with the app call)
            
        Returns:
            True if the donation is successful
        """
        # Validate the payment transaction
        assert payment.receiver == Global.current_application_address, "Payment must be sent to contract"
        assert payment.sender == Txn.sender, "Payment sender must match transaction sender"
        assert payment.amount > 0, "Payment amount must be greater than 0"
        
        # Immediately transfer the funds to the recipient
        itxn.Payment(
            amount=payment.amount,
            receiver=recipient_address.native,
            fee=0,
        ).submit()
        
        return True
    
    @abimethod()
    def create_conditional_donation(
        self,
        event_id: arc4.UInt64,
        recipient_yes: arc4.Address,
        recipient_no: arc4.Address,
        payment: gtxn.PaymentTransaction
    ) -> arc4.UInt64:
        """
        Create a conditional donation that will pay out based on event resolution.
        
        Args:
            event_id: The event this donation depends on
            recipient_yes: Address to receive funds if event resolves to true
            recipient_no: Address to receive funds if event resolves to false
            payment: The payment transaction (funds held in escrow)
            
        Returns:
            The clause ID of the created conditional donation
        """
        # Ensure the event exists and is still pending
        assert event_id in self.listed_events, "Event does not exist"
        event_struct = self.listed_events[event_id].copy()
        assert event_struct.pending.native, "Event has already been resolved"
        
        # Validate the payment transaction
        assert payment.receiver == Global.current_application_address, "Payment must be sent to contract"
        assert payment.sender == Txn.sender, "Payment sender must match transaction sender"
        assert payment.amount > 0, "Payment amount must be greater than 0"
        
        # Use timestamp + hash of sender for unique clause ID to avoid collisions
        sender_hash = op.sha256(Txn.sender.bytes)
        clause_id = arc4.UInt64(Global.latest_timestamp + op.btoi(sender_hash[:8]))
        
        # Create and store the conditional clause
        self.conditional_clauses[clause_id] = ConditionalClauseStruct(
            clause_id=clause_id,
            event_id=event_id,
            payout_amount=arc4.UInt64(payment.amount),
            recipient_yes=recipient_yes,
            recipient_no=recipient_no,
            donor_address=arc4.Address(Txn.sender),
            executed=arc4.Bool(False)
        )
        
        return clause_id
    
    @abimethod()
    def resolve_event(
        self,
        event_id: arc4.UInt64,
        resolution: arc4.Bool
    ) -> bool:
        """
        Resolve an event outcome. Can only be called by the authorized oracle.
        
        Args:
            event_id: The event to resolve
            resolution: The outcome of the event (true/false)
            
        Returns:
            True if the event is successfully resolved
        """
        # Ensure the event exists
        assert event_id in self.listed_events, "Event does not exist"
        
        event_struct = self.listed_events[event_id].copy()
        
        # Ensure the event is still pending
        assert event_struct.pending.native, "Event has already been resolved"
        
        # Ensure the caller is the authorized oracle
        assert Txn.sender == event_struct.oracle_address.native, "Only authorized oracle can resolve event"
        
        # Update the event struct
        event_struct.pending = arc4.Bool(False)
        event_struct.resolution = resolution
        self.listed_events[event_id] = event_struct.copy()
        
        return True
    
    @abimethod()
    def execute_conditional_clause(
        self,
        clause_id: arc4.UInt64
    ) -> bool:
        """
        Execute a conditional clause after its associated event has been resolved.
        Can be called by anyone to trigger payouts.
        
        Args:
            clause_id: The clause to execute
            
        Returns:
            True if the clause is successfully executed
        """
        # Ensure the clause exists
        assert clause_id in self.conditional_clauses, "Clause does not exist"
        
        clause_struct = self.conditional_clauses[clause_id].copy()
        
        # Ensure the clause hasn't been executed yet
        assert not clause_struct.executed.native, "Clause has already been executed"
        
        # Get the associated event
        assert clause_struct.event_id in self.listed_events, "Associated event does not exist"
        event_struct = self.listed_events[clause_struct.event_id].copy()
        
        # Ensure the event has been resolved
        assert not event_struct.pending.native, "Event has not been resolved yet"
        
        # Determine recipient based on event resolution
        if event_struct.resolution.native:
            recipient = clause_struct.recipient_yes.native
        else:
            recipient = clause_struct.recipient_no.native
        
        # Execute the payout
        itxn.Payment(
            amount=clause_struct.payout_amount.native,
            receiver=recipient,
            fee=0,
        ).submit()
        
        # Mark the clause as executed
        clause_struct.executed = arc4.Bool(True)
        self.conditional_clauses[clause_id] = clause_struct.copy()
        
        return True
    
    @abimethod(readonly=True)
    def get_event_info(
        self,
        event_id: arc4.UInt64
    ) -> EventStruct:
        """
        Get information about an event.
        
        Args:
            event_id: The event ID to query
            
        Returns:
            The EventStruct containing the event's information
        """
        assert event_id in self.listed_events, "Event does not exist"
        return self.listed_events[event_id]
    
    @abimethod(readonly=True)
    def get_clause_info(
        self,
        clause_id: arc4.UInt64
    ) -> ConditionalClauseStruct:
        """
        Get information about a conditional clause.
        
        Args:
            clause_id: The clause ID to query
            
        Returns:
            The ConditionalClauseStruct containing the clause's information
        """
        assert clause_id in self.conditional_clauses, "Clause does not exist"
        return self.conditional_clauses[clause_id]