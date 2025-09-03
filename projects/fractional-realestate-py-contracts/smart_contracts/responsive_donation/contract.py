from algopy import (
    ARC4Contract,
    BoxMap,
    Global,
    Txn,
    arc4,
    gtxn,
    itxn,
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
    - Automatic payout execution when events are resolved
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
        
        # Counter for generating unique IDs
        self.next_event_id = arc4.UInt64(1)
        self.next_clause_id = arc4.UInt64(1)
    
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
        event_id = self.next_event_id
        
        # Create and store the event struct
        self.listed_events[event_id] = EventStruct(
            event_id=event_id,
            event_string=event_string,
            pending=arc4.Bool(True),
            resolution=arc4.Bool(False),  # Default resolution, not meaningful until pending=false
            oracle_address=oracle_address
        )
        
        # Increment counter for next event
        self.next_event_id = arc4.UInt64(event_id.native + 1)
        
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
        
        return arc4.Bool(True)
    
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
        event_struct = self.listed_events[event_id]
        assert event_struct.pending.native, "Event has already been resolved"
        
        # Validate the payment transaction
        assert payment.receiver == Global.current_application_address, "Payment must be sent to contract"
        assert payment.sender == Txn.sender, "Payment sender must match transaction sender"
        assert payment.amount > 0, "Payment amount must be greater than 0"
        
        clause_id = self.next_clause_id
        
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
        
        # Increment counter for next clause
        self.next_clause_id = arc4.UInt64(clause_id.native + 1)
        
        return clause_id
    
    @abimethod()
    def mixed_donation(
        self,
        instant_recipient: arc4.Address,
        instant_amount: arc4.UInt64,
        conditional_events: arc4.DynamicArray[arc4.UInt64],
        conditional_amounts: arc4.DynamicArray[arc4.UInt64],
        recipients_yes: arc4.DynamicArray[arc4.Address],
        recipients_no: arc4.DynamicArray[arc4.Address],
        payment: gtxn.PaymentTransaction
    ) -> arc4.DynamicArray[arc4.UInt64]:
        """
        Create both instantaneous and conditional donations in a single transaction.
        
        Args:
            instant_recipient: Address to receive instant donation (use zero address if no instant donation)
            instant_amount: Amount for instant donation (use 0 if no instant donation)
            conditional_events: Array of event IDs for conditional donations
            conditional_amounts: Array of amounts for each conditional donation
            recipients_yes: Array of addresses to receive funds if events resolve to true
            recipients_no: Array of addresses to receive funds if events resolve to false
            payment: The payment transaction covering all donations
            
        Returns:
            Array of clause IDs for the conditional donations created
        """
        # Validate input arrays have same length
        assert conditional_events.length == conditional_amounts.length, "Events and amounts arrays must have same length"
        assert conditional_events.length == recipients_yes.length, "Events and recipients_yes arrays must have same length"
        assert conditional_events.length == recipients_no.length, "Events and recipients_no arrays must have same length"
        
        # Validate the payment transaction
        assert payment.receiver == Global.current_application_address, "Payment must be sent to contract"
        assert payment.sender == Txn.sender, "Payment sender must match transaction sender"
        assert payment.amount > 0, "Payment amount must be greater than 0"
        
        # Calculate total required amount
        total_conditional = arc4.UInt64(0)
        for i in range(conditional_amounts.length):
            total_conditional = arc4.UInt64(total_conditional.native + conditional_amounts[i].native)
        
        total_required = instant_amount.native + total_conditional.native
        assert payment.amount == total_required, "Payment amount must equal sum of all donations"
        
        # Process instant donation if specified
        if instant_amount.native > 0:
            itxn.Payment(
                amount=instant_amount.native,
                receiver=instant_recipient.native,
                fee=0,
            ).submit()
        
        # Create conditional donations
        clause_ids = arc4.DynamicArray[arc4.UInt64]()
        
        for i in range(conditional_events.length):
            event_id = conditional_events[i]
            amount = conditional_amounts[i]
            recipient_yes = recipients_yes[i]
            recipient_no = recipients_no[i]
            
            # Validate each event exists and is pending
            assert event_id in self.listed_events, f"Event {event_id.native} does not exist"
            event_struct = self.listed_events[event_id]
            assert event_struct.pending.native, f"Event {event_id.native} has already been resolved"
            
            # Create conditional clause
            clause_id = self.next_clause_id
            
            self.conditional_clauses[clause_id] = ConditionalClauseStruct(
                clause_id=clause_id,
                event_id=event_id,
                payout_amount=amount,
                recipient_yes=recipient_yes,
                recipient_no=recipient_no,
                donor_address=arc4.Address(Txn.sender),
                executed=arc4.Bool(False)
            )
            
            # Add clause ID to return array
            clause_ids.append(clause_id)
            
            # Increment counter for next clause
            self.next_clause_id = arc4.UInt64(clause_id.native + 1)
        
        return clause_ids
    
    def _validate_event_resolution(
        self,
        event_id: arc4.UInt64,
        resolution: arc4.Bool
    ) -> bool:
        """
        CORE SMART CONTRACT LOGIC: Validate event resolutions using on-chain data.
        This is where the contract becomes truly "smart" by having built-in validation rules.
        
        Args:
            event_id: The event to validate
            resolution: The claimed resolution
            
        Returns:
            True if the resolution is valid according to contract logic
        """
        event_struct = self.listed_events[event_id]
        event_string = event_struct.event_string.native
        
        # CONTRACT VALIDATION RULES - Add your custom logic here
        
        # Rule 1: Time-based validation
        # Example: "Hurricane hits Miami by Dec 31, 2025"
        if "by Dec 31, 2025" in event_string:
            current_time = Global.latest_timestamp
            deadline = 1735689600  # Dec 31, 2025 timestamp
            if current_time > deadline:
                # Past deadline - anyone can resolve based on historical data
                return True
        
        # Rule 2: Oracle-authorized resolution (fallback)
        # If no other rules match, require oracle authorization
        if Txn.sender == event_struct.oracle_address.native:
            return True
        
        # Rule 3: Consensus-based resolution
        # Could implement: "If 3+ different addresses submit same resolution"
        # (Would need additional state tracking)
        
        # Rule 4: External data validation
        # Example: Check Algorand randomness, other on-chain data
        # if self._check_algorand_randomness(event_id, resolution):
        #     return True
        
        # Rule 5: Multi-sig validation
        # Could require multiple oracle signatures
        
        # For MVP: Accept oracle resolutions and time-based auto-resolution
        return False
    
    @abimethod()
    def batch_resolve_clauses(
        self,
        event_id: arc4.UInt64,
        resolution: arc4.Bool,
        clause_ids: arc4.DynamicArray[arc4.UInt64]
    ) -> arc4.UInt64:
        """
        Smart batch resolution: Submit one event resolution and the contract
        automatically executes ALL valid clauses for that event.
        
        Args:
            event_id: The event being resolved
            resolution: The claimed outcome
            clause_ids: All clause IDs that should be executed for this event
            
        Returns:
            Number of clauses successfully executed
        """
        # Validate the event resolution using contract logic
        assert self._validate_event_resolution(event_id, resolution), "Event resolution rejected by contract"
        
        # Update event status
        event_struct = self.listed_events[event_id].copy()
        if event_struct.pending.native:
            event_struct.pending = arc4.Bool(False)
            event_struct.resolution = resolution
            self.listed_events[event_id] = event_struct
        
        # Execute all valid clauses
        executed_count = 0
        
        for i in range(clause_ids.length):
            clause_id = clause_ids[i]
            
            if clause_id in self.conditional_clauses:
                clause_struct = self.conditional_clauses[clause_id].copy()
                
                # Verify clause is for this event and not executed
                if (clause_struct.event_id.native == event_id.native and 
                    not clause_struct.executed.native):
                    
                    # Execute the clause
                    if resolution.native:
                        recipient = clause_struct.recipient_yes.native
                    else:
                        recipient = clause_struct.recipient_no.native
                    
                    itxn.Payment(
                        amount=clause_struct.payout_amount.native,
                        receiver=recipient,
                        fee=0,
                    ).submit()
                    
                    # Mark as executed
                    clause_struct.executed = arc4.Bool(True)
                    self.conditional_clauses[clause_id] = clause_struct
                    executed_count += 1
        
        return arc4.UInt64(executed_count)
    
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
        self.listed_events[event_id] = event_struct
        
        return arc4.Bool(True)
    
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
        event_struct = self.listed_events[clause_struct.event_id]
        
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
        self.conditional_clauses[clause_id] = clause_struct
        
        return arc4.Bool(True)
    
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
    
    @abimethod(readonly=True)
    def get_pending_events(self) -> arc4.DynamicArray[arc4.UInt64]:
        """
        Get all pending event IDs. Oracle can use this to know which events to monitor.
        Note: This is a simplified version - in production you'd want pagination
        for large numbers of events.
        
        Returns:
            Array of pending event IDs
        """
        # Note: In practice, you'd implement this more efficiently with indexing
        # This is a simplified version for demonstration
        pending_events = arc4.DynamicArray[arc4.UInt64]()
        
        # This would require iteration through box storage in a real implementation
        # For now, this is a placeholder that shows the interface
        return pending_events
    
    @abimethod(readonly=True) 
    def get_clauses_for_event(
        self,
        event_id: arc4.UInt64
    ) -> arc4.DynamicArray[arc4.UInt64]:
        """
        Get all clause IDs that depend on a specific event.
        Oracle can call this when resolving an event to get all clauses to execute.
        
        Args:
            event_id: The event to get clauses for
            
        Returns:
            Array of clause IDs that depend on this event
        """
        # Note: In a production system, you'd maintain an index of event->clauses
        # This is a simplified interface for demonstration
        clause_ids = arc4.DynamicArray[arc4.UInt64]()
        
        # This would require efficient indexing in a real implementation
        # For now, this shows the intended interface
        return clause_ids