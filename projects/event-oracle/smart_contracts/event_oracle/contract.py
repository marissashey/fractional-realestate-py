from algopy import (
    ARC4Contract,
    BoxMap,
    Global,
    Txn,
    arc4,
    gtxn,
    itxn,
    op,
    urange,
)
from algopy.arc4 import abimethod
from typing import Literal


# Oracle voting data for ResponsiveDonation events
class OracleEventStruct(arc4.Struct):
    """
    OracleEventStruct
    
    Stores voting and dispute data for a ResponsiveDonation event.
    The actual event data lives in the ResponsiveDonation contract.
    
    Fields:
    - responsive_donation_app_id: The ResponsiveDonation contract app ID
    - event_id: The event ID from ResponsiveDonation contract
    - initial_proposal: The initial proposed outcome (true/false)
    - proposer_address: Address that made the initial proposal
    - proposal_stake: Amount staked on the initial proposal
    - dispute_deadline: Timestamp when dispute period ends
    - voting_deadline: Timestamp when voting period ends
    - total_stake_yes: Total tokens staked on "yes" outcome
    - total_stake_no: Total tokens staked on "no" outcome
    - resolved: Whether the event has been resolved
    - final_outcome: The final resolved outcome (only valid when resolved=true)
    - dispute_count: Number of dispute rounds that have occurred
    """
    responsive_donation_app_id: arc4.UInt64
    event_id: arc4.UInt64
    initial_proposal: arc4.Bool
    proposer_address: arc4.Address
    proposal_stake: arc4.UInt64
    dispute_deadline: arc4.UInt64
    voting_deadline: arc4.UInt64
    total_stake_yes: arc4.UInt64
    total_stake_no: arc4.UInt64
    resolved: arc4.Bool
    final_outcome: arc4.Bool
    dispute_count: arc4.UInt64


class VoteStruct(arc4.Struct):
    """
    VoteStruct
    
    Represents a vote cast by a user on an event.
    
    Fields:
    - responsive_donation_app_id: The ResponsiveDonation contract app ID
    - event_id: The event being voted on
    - voter_address: Address of the voter
    - vote_outcome: The outcome voted for (true/false)
    - stake_amount: Amount of tokens staked on this vote
    - vote_timestamp: When the vote was cast
    """
    responsive_donation_app_id: arc4.UInt64
    event_id: arc4.UInt64
    voter_address: arc4.Address
    vote_outcome: arc4.Bool
    stake_amount: arc4.UInt64
    vote_timestamp: arc4.UInt64


class DisputeStruct(arc4.Struct):
    """
    DisputeStruct
    
    Represents a dispute raised against an initial proposal.
    
    Fields:
    - responsive_donation_app_id: The ResponsiveDonation contract app ID
    - event_id: The event being disputed
    - disputer_address: Address that raised the dispute
    - dispute_stake: Amount staked to raise the dispute
    - dispute_outcome: The outcome the disputer believes is correct
    - dispute_timestamp: When the dispute was raised
    - dispute_round: Which round of dispute this is (starts at 1)
    """
    responsive_donation_app_id: arc4.UInt64
    event_id: arc4.UInt64
    disputer_address: arc4.Address
    dispute_stake: arc4.UInt64
    dispute_outcome: arc4.Bool
    dispute_timestamp: arc4.UInt64
    dispute_round: arc4.UInt64


class EventOracle(ARC4Contract):
    """
    EventOracle Contract - MVP Version
    
    A decentralized oracle system using token-weighted voting with dispute mechanisms.
    Works with ResponsiveDonation events instead of creating its own events.
    
    Core Features:
    1. 🎯 Event Proposal - Make initial proposals for ResponsiveDonation events
    2. 💰 Token-Weighted Voting - Users stake tokens to vote on outcomes
    3. 🔥 Dispute Mechanism - Challenge initial proposals with escalating stakes
    4. ⏰ Time-Bounded Resolution - Events resolve automatically after voting periods
    5. 🏆 Economic Incentives - Winners receive stakes from losers
    6. 🔗 ResponsiveDonation Integration - Automatically resolve events in ResponsiveDonation
    
    Voting Process:
    1. Someone makes an initial proposal for a ResponsiveDonation event with stake
    2. 24-hour dispute period - anyone can challenge with 2x stake
    3. If disputed, 48-hour voting period opens for token-weighted voting
    4. Final resolution based on stake-weighted majority
    5. Winners claim rewards, losers forfeit stakes
    6. Oracle automatically resolves the event in ResponsiveDonation contract
    """
    
    def __init__(self) -> None:
        # BoxMap for oracle events (key: composite key of app_id + event_id, value: OracleEventStruct)
        self.oracle_events = BoxMap(
            arc4.StaticArray[arc4.Byte, Literal[16]],  # 8 bytes app_id + 8 bytes event_id
            OracleEventStruct,
            key_prefix="oracle_events"
        )
        
        # BoxMap for votes (key: composite key of app_id + event_id + voter_address, value: VoteStruct)
        self.votes = BoxMap(
            arc4.StaticArray[arc4.Byte, Literal[48]],  # 8 bytes app_id + 8 bytes event_id + 32 bytes address
            VoteStruct,
            key_prefix="votes"
        )
        
        # BoxMap for disputes (key: composite key of app_id + event_id + dispute_round, value: DisputeStruct)
        self.disputes = BoxMap(
            arc4.StaticArray[arc4.Byte, Literal[24]],  # 8 bytes app_id + 8 bytes event_id + 8 bytes dispute_round
            DisputeStruct,
            key_prefix="disputes"
        )
        
        # BoxMap for user stakes per event (key: composite key of app_id + event_id + user_address, value: total_stake)
        self.user_stakes = BoxMap(
            arc4.StaticArray[arc4.Byte, Literal[48]],  # 8 bytes app_id + 8 bytes event_id + 32 bytes address
            arc4.UInt64,
            key_prefix="stakes"
        )

    def _get_oracle_event_key(self, responsive_donation_app_id: arc4.UInt64, event_id: arc4.UInt64) -> arc4.StaticArray[arc4.Byte, Literal[16]]:
        """Create composite key for oracle events"""
        key_bytes = responsive_donation_app_id.bytes + event_id.bytes
        return arc4.StaticArray.from_bytes(key_bytes)

    def _get_vote_key(self, responsive_donation_app_id: arc4.UInt64, event_id: arc4.UInt64, voter_address: arc4.Address) -> arc4.StaticArray[arc4.Byte, Literal[48]]:
        """Create composite key for votes"""
        key_bytes = responsive_donation_app_id.bytes + event_id.bytes + voter_address.bytes
        return arc4.StaticArray.from_bytes(key_bytes)

    def _get_dispute_key(self, responsive_donation_app_id: arc4.UInt64, event_id: arc4.UInt64, dispute_round: arc4.UInt64) -> arc4.StaticArray[arc4.Byte, Literal[24]]:
        """Create composite key for disputes"""
        key_bytes = responsive_donation_app_id.bytes + event_id.bytes + dispute_round.bytes
        return arc4.StaticArray.from_bytes(key_bytes)

    def _get_stake_key(self, responsive_donation_app_id: arc4.UInt64, event_id: arc4.UInt64, user_address: arc4.Address) -> arc4.StaticArray[arc4.Byte, Literal[48]]:
        """Create composite key for user stakes"""
        key_bytes = responsive_donation_app_id.bytes + event_id.bytes + user_address.bytes
        return arc4.StaticArray.from_bytes(key_bytes)

    @abimethod()
    def propose_outcome(
        self,
        responsive_donation_app_id: arc4.UInt64,
        event_id: arc4.UInt64,
        proposed_outcome: arc4.Bool,
        payment: gtxn.PaymentTransaction
    ) -> bool:
        """
        Make an initial proposal for a ResponsiveDonation event outcome with stake.
        This starts the dispute period (optimistic oracle approach).
        
        Args:
            responsive_donation_app_id: The ResponsiveDonation contract app ID
            event_id: The event ID from ResponsiveDonation to propose outcome for
            proposed_outcome: The proposed outcome (true/false)
            payment: The stake payment (minimum 10 ALGO = 10,000,000 microAlgos)
            
        Returns:
            True if proposal is successful
        """
        # Verify minimum stake
        assert payment.amount >= 10_000_000, "Minimum stake is 10 ALGO"
        assert payment.receiver == Global.current_application_address, "Payment must be to this contract"
        
        # Create composite key
        oracle_event_key = self._get_oracle_event_key(responsive_donation_app_id, event_id)
        
        # Ensure this event doesn't already have a proposal
        assert oracle_event_key not in self.oracle_events, "Event already has a proposal"
        
        # TODO: Verify the event exists in ResponsiveDonation contract
        # For MVP, we'll skip this verification to avoid cross-contract calls during proposal
        
        # Create oracle event with initial proposal
        current_time = arc4.UInt64(Global.latest_timestamp)
        dispute_deadline = arc4.UInt64(Global.latest_timestamp + 86400)  # 24 hours
        voting_deadline = arc4.UInt64(Global.latest_timestamp + 259200)   # 72 hours
        
        oracle_event = OracleEventStruct(
            responsive_donation_app_id=responsive_donation_app_id,
            event_id=event_id,
            initial_proposal=proposed_outcome,
            proposer_address=arc4.Address(Txn.sender),
            proposal_stake=arc4.UInt64(payment.amount),
            dispute_deadline=dispute_deadline,
            voting_deadline=voting_deadline,
            total_stake_yes=arc4.UInt64(payment.amount if proposed_outcome.native else 0),
            total_stake_no=arc4.UInt64(payment.amount if not proposed_outcome.native else 0),
            resolved=arc4.Bool(False),
            final_outcome=arc4.Bool(False),
            dispute_count=arc4.UInt64(0)
        )
        
        self.oracle_events[oracle_event_key] = oracle_event
        
        # Record user stake
        stake_key = self._get_stake_key(responsive_donation_app_id, event_id, arc4.Address(Txn.sender))
        self.user_stakes[stake_key] = arc4.UInt64(payment.amount)
        
        return True

    @abimethod()
    def raise_dispute(
        self,
        responsive_donation_app_id: arc4.UInt64,
        event_id: arc4.UInt64,
        dispute_outcome: arc4.Bool,
        payment: gtxn.PaymentTransaction
    ) -> arc4.UInt64:
        """
        Raise a dispute against the initial proposal.
        Requires 2x the original stake to prevent frivolous disputes.
        
        Args:
            responsive_donation_app_id: The ResponsiveDonation contract app ID
            event_id: The event to dispute
            dispute_outcome: The outcome the disputer believes is correct
            payment: The dispute stake (must be 2x the proposal stake)
            
        Returns:
            The dispute round number
        """
        oracle_event_key = self._get_oracle_event_key(responsive_donation_app_id, event_id)
        
        # Ensure oracle event exists
        assert oracle_event_key in self.oracle_events, "Oracle event does not exist"
        oracle_event = self.oracle_events[oracle_event_key].copy()
        
        # Ensure we're still in dispute period
        assert Global.latest_timestamp <= oracle_event.dispute_deadline.native, "Dispute period has ended"
        
        # Ensure not already resolved
        assert not oracle_event.resolved.native, "Event already resolved"
        
        # Require 2x the proposal stake
        required_stake = oracle_event.proposal_stake.native * 2
        assert payment.amount >= required_stake, "Dispute stake must be 2x proposal stake"
        assert payment.receiver == Global.current_application_address, "Payment must be to this contract"
        
        # Increment dispute count
        oracle_event.dispute_count = arc4.UInt64(oracle_event.dispute_count.native + 1)
        dispute_round = oracle_event.dispute_count
        
        # Create dispute record
        dispute_key = self._get_dispute_key(responsive_donation_app_id, event_id, dispute_round)
        dispute = DisputeStruct(
            responsive_donation_app_id=responsive_donation_app_id,
            event_id=event_id,
            disputer_address=arc4.Address(Txn.sender),
            dispute_stake=arc4.UInt64(payment.amount),
            dispute_outcome=dispute_outcome,
            dispute_timestamp=arc4.UInt64(Global.latest_timestamp),
            dispute_round=dispute_round
        )
        self.disputes[dispute_key] = dispute
        
        # Update total stakes
        if dispute_outcome.native:
            oracle_event.total_stake_yes = arc4.UInt64(oracle_event.total_stake_yes.native + payment.amount)
        else:
            oracle_event.total_stake_no = arc4.UInt64(oracle_event.total_stake_no.native + payment.amount)
        
        # Update oracle event
        self.oracle_events[oracle_event_key] = oracle_event
        
        # Record user stake
        stake_key = self._get_stake_key(responsive_donation_app_id, event_id, arc4.Address(Txn.sender))
        current_stake = self.user_stakes[stake_key].native if stake_key in self.user_stakes else 0
        self.user_stakes[stake_key] = arc4.UInt64(current_stake + payment.amount)
        
        return dispute_round

    @abimethod()
    def vote(
        self,
        responsive_donation_app_id: arc4.UInt64,
        event_id: arc4.UInt64,
        vote_outcome: arc4.Bool,
        payment: gtxn.PaymentTransaction
    ) -> bool:
        """
        Cast a vote on a disputed event.
        Requires staking tokens. Votes are weighted by stake amount.
        
        Args:
            responsive_donation_app_id: The ResponsiveDonation contract app ID
            event_id: The event to vote on
            vote_outcome: The outcome to vote for (true/false)
            payment: The voting stake (minimum 1 ALGO)
            
        Returns:
            True if vote is successful
        """
        oracle_event_key = self._get_oracle_event_key(responsive_donation_app_id, event_id)
        
        # Ensure oracle event exists
        assert oracle_event_key in self.oracle_events, "Oracle event does not exist"
        oracle_event = self.oracle_events[oracle_event_key].copy()
        
        # Ensure we're in voting period (after dispute period, before voting deadline)
        assert Global.latest_timestamp > oracle_event.dispute_deadline.native, "Voting period not started"
        assert Global.latest_timestamp <= oracle_event.voting_deadline.native, "Voting period has ended"
        
        # Ensure not already resolved
        assert not oracle_event.resolved.native, "Event already resolved"
        
        # Ensure there's been at least one dispute
        assert oracle_event.dispute_count.native > 0, "No disputes raised, voting not needed"
        
        # Verify minimum stake
        assert payment.amount >= 1_000_000, "Minimum voting stake is 1 ALGO"
        assert payment.receiver == Global.current_application_address, "Payment must be to this contract"
        
        # Check if user already voted (update existing vote)
        vote_key = self._get_vote_key(responsive_donation_app_id, event_id, arc4.Address(Txn.sender))
        
        if vote_key in self.votes:
            # User already voted, update their vote
            existing_vote = self.votes[vote_key].copy()
            
            # Remove old vote from totals
            if existing_vote.vote_outcome.native:
                oracle_event.total_stake_yes = arc4.UInt64(oracle_event.total_stake_yes.native - existing_vote.stake_amount.native)
            else:
                oracle_event.total_stake_no = arc4.UInt64(oracle_event.total_stake_no.native - existing_vote.stake_amount.native)
            
            # Update vote
            existing_vote.vote_outcome = vote_outcome
            existing_vote.stake_amount = arc4.UInt64(existing_vote.stake_amount.native + payment.amount)
            existing_vote.vote_timestamp = arc4.UInt64(Global.latest_timestamp)
            self.votes[vote_key] = existing_vote
            
            # Update user stake
            stake_key = self._get_stake_key(responsive_donation_app_id, event_id, arc4.Address(Txn.sender))
            current_stake = self.user_stakes[stake_key].native if stake_key in self.user_stakes else 0
            self.user_stakes[stake_key] = arc4.UInt64(current_stake + payment.amount)
        else:
            # New vote
            vote = VoteStruct(
                responsive_donation_app_id=responsive_donation_app_id,
                event_id=event_id,
                voter_address=arc4.Address(Txn.sender),
                vote_outcome=vote_outcome,
                stake_amount=arc4.UInt64(payment.amount),
                vote_timestamp=arc4.UInt64(Global.latest_timestamp)
            )
            self.votes[vote_key] = vote
            
            # Record user stake
            stake_key = self._get_stake_key(responsive_donation_app_id, event_id, arc4.Address(Txn.sender))
            current_stake = self.user_stakes[stake_key].native if stake_key in self.user_stakes else 0
            self.user_stakes[stake_key] = arc4.UInt64(current_stake + payment.amount)
        
        # Add new vote to totals
        if vote_outcome.native:
            oracle_event.total_stake_yes = arc4.UInt64(oracle_event.total_stake_yes.native + payment.amount)
        else:
            oracle_event.total_stake_no = arc4.UInt64(oracle_event.total_stake_no.native + payment.amount)
        
        # Update oracle event
        self.oracle_events[oracle_event_key] = oracle_event
        
        return True

    @abimethod()
    def resolve_event(
        self,
        responsive_donation_app_id: arc4.UInt64,
        event_id: arc4.UInt64
    ) -> bool:
        """
        Resolve an event based on the voting results or timeout.
        Can be called by anyone after the voting deadline.
        
        Args:
            responsive_donation_app_id: The ResponsiveDonation contract app ID
            event_id: The event to resolve
            
        Returns:
            True if event is successfully resolved
        """
        oracle_event_key = self._get_oracle_event_key(responsive_donation_app_id, event_id)
        
        # Ensure oracle event exists
        assert oracle_event_key in self.oracle_events, "Oracle event does not exist"
        oracle_event = self.oracle_events[oracle_event_key].copy()
        
        # Ensure not already resolved
        assert not oracle_event.resolved.native, "Event already resolved"
        
        # Determine final outcome
        final_outcome: bool
        
        if oracle_event.dispute_count.native == 0:
            # No disputes, use initial proposal
            final_outcome = oracle_event.initial_proposal.native
        elif Global.latest_timestamp > oracle_event.voting_deadline.native:
            # Voting period ended, use majority stake
            final_outcome = oracle_event.total_stake_yes.native > oracle_event.total_stake_no.native
        else:
            # Still in voting period
            assert False, "Voting period not ended"
        
        # Update oracle event
        oracle_event.resolved = arc4.Bool(True)
        oracle_event.final_outcome = arc4.Bool(final_outcome)
        self.oracle_events[oracle_event_key] = oracle_event
        
        return True

    @abimethod()
    def resolve_event_expedited(
        self,
        responsive_donation_app_id: arc4.UInt64,
        event_id: arc4.UInt64,
        force_outcome: arc4.Bool
    ) -> bool:
        """
        DEMO/TESTING ONLY: Expedited resolution for demo purposes.
        Allows immediate resolution by anyone for testing.
        
        Args:
            responsive_donation_app_id: The ResponsiveDonation contract app ID
            event_id: The event to resolve
            force_outcome: The outcome to force
            
        Returns:
            True if event is successfully resolved
        """
        oracle_event_key = self._get_oracle_event_key(responsive_donation_app_id, event_id)
        
        # Ensure oracle event exists
        assert oracle_event_key in self.oracle_events, "Oracle event does not exist"
        oracle_event = self.oracle_events[oracle_event_key].copy()
        
        # Ensure not already resolved
        assert not oracle_event.resolved.native, "Event already resolved"
        
        # Force resolution
        oracle_event.resolved = arc4.Bool(True)
        oracle_event.final_outcome = force_outcome
        self.oracle_events[oracle_event_key] = oracle_event
        
        return True

    @abimethod()
    def resolve_responsive_donation_event(
        self,
        responsive_donation_app_id: arc4.UInt64,
        event_id: arc4.UInt64
    ) -> bool:
        """
        Resolve an event in the ResponsiveDonation contract using our oracle's resolution.
        
        This method allows the EventOracle to act as an automated resolver for 
        ResponsiveDonation events, bridging the two contracts.
        
        Args:
            responsive_donation_app_id: The app ID of the ResponsiveDonation contract
            event_id: The event ID to resolve (must exist in both contracts)
            
        Returns:
            True if the event is successfully resolved in ResponsiveDonation
        """
        oracle_event_key = self._get_oracle_event_key(responsive_donation_app_id, event_id)
        
        # Ensure our oracle event exists and is resolved
        assert oracle_event_key in self.oracle_events, "Oracle event does not exist"
        oracle_event = self.oracle_events[oracle_event_key].copy()
        assert oracle_event.resolved.native, "Oracle event not resolved yet"
        
        # Call the ResponsiveDonation contract to resolve the event
        # Method signature for resolve_event(uint64,bool)bool
        method_selector = op.sha512_256(b"resolve_event(uint64,bool)bool")[:4]
        
        itxn.ApplicationCall(
            app_id=responsive_donation_app_id.native,
            app_args=(
                method_selector,
                event_id.bytes,
                oracle_event.final_outcome.bytes,
            ),
            fee=0,
        ).submit()
        
        return True

    @abimethod()
    def claim_rewards(
        self,
        responsive_donation_app_id: arc4.UInt64,
        event_id: arc4.UInt64
    ) -> arc4.UInt64:
        """
        Claim rewards for correct votes/proposals after event resolution.
        
        Args:
            responsive_donation_app_id: The ResponsiveDonation contract app ID
            event_id: The resolved event to claim rewards for
            
        Returns:
            Amount of rewards claimed in microALGO
        """
        oracle_event_key = self._get_oracle_event_key(responsive_donation_app_id, event_id)
        
        # Ensure oracle event exists and is resolved
        assert oracle_event_key in self.oracle_events, "Oracle event does not exist"
        oracle_event = self.oracle_events[oracle_event_key].copy()
        assert oracle_event.resolved.native, "Event not resolved yet"
        
        stake_key = self._get_stake_key(responsive_donation_app_id, event_id, arc4.Address(Txn.sender))
        
        # Ensure user has stakes to claim
        assert stake_key in self.user_stakes, "No stakes found for user"
        user_stake = self.user_stakes[stake_key].native
        assert user_stake > 0, "No stakes to claim"
        
        # Determine if user was on winning side
        vote_key = self._get_vote_key(responsive_donation_app_id, event_id, arc4.Address(Txn.sender))
        user_voted_correctly = False
        
        if vote_key in self.votes:
            # User voted, check if they voted correctly
            user_vote = self.votes[vote_key]
            user_voted_correctly = user_vote.vote_outcome.native == oracle_event.final_outcome.native
        else:
            # User didn't vote (only made proposal/dispute), check if they were correct
            user_voted_correctly = (
                (arc4.Address(Txn.sender) == oracle_event.proposer_address and 
                 oracle_event.initial_proposal.native == oracle_event.final_outcome.native)
            )
        
        assert user_voted_correctly, "User was not on the winning side"
        
        # Calculate rewards (simplified: user gets their stake back plus proportional share of losing stakes)
        total_winning_stake = (oracle_event.total_stake_yes.native if oracle_event.final_outcome.native 
                             else oracle_event.total_stake_no.native)
        total_losing_stake = (oracle_event.total_stake_no.native if oracle_event.final_outcome.native 
                            else oracle_event.total_stake_yes.native)
        
        # User's share of the losing stakes (proportional to their winning stake)
        reward_share = (user_stake * total_losing_stake) // total_winning_stake if total_winning_stake > 0 else 0
        total_reward = user_stake + reward_share
        
        # Clear user's stake (prevent double claiming)
        del self.user_stakes[stake_key]
        
        # Send reward to user
        if total_reward > 0:
            itxn.Payment(
                receiver=Txn.sender,
                amount=total_reward,
                fee=0,
            ).submit()
        
        return arc4.UInt64(total_reward)

    @abimethod()
    def get_event_info(
        self,
        responsive_donation_app_id: arc4.UInt64,
        event_id: arc4.UInt64
    ) -> OracleEventStruct:
        """
        Get information about an oracle event.
        
        Args:
            responsive_donation_app_id: The ResponsiveDonation contract app ID
            event_id: The event ID to query
            
        Returns:
            The OracleEventStruct containing all event information
        """
        oracle_event_key = self._get_oracle_event_key(responsive_donation_app_id, event_id)
        
        assert oracle_event_key in self.oracle_events, "Oracle event does not exist"
        return self.oracle_events[oracle_event_key].copy()

    @abimethod()
    def get_vote_info(
        self,
        responsive_donation_app_id: arc4.UInt64,
        event_id: arc4.UInt64,
        voter_address: arc4.Address
    ) -> VoteStruct:
        """
        Get voting information for a specific user on an event.
        
        Args:
            responsive_donation_app_id: The ResponsiveDonation contract app ID
            event_id: The event ID to query
            voter_address: The voter's address
            
        Returns:
            The VoteStruct containing the user's vote information
        """
        vote_key = self._get_vote_key(responsive_donation_app_id, event_id, voter_address)
        
        assert vote_key in self.votes, "Vote not found"
        return self.votes[vote_key].copy()

    @abimethod()
    def get_user_stake(
        self,
        responsive_donation_app_id: arc4.UInt64,
        event_id: arc4.UInt64,
        user_address: arc4.Address
    ) -> arc4.UInt64:
        """
        Get the total stake amount for a user on an event.
        
        Args:
            responsive_donation_app_id: The ResponsiveDonation contract app ID
            event_id: The event ID to query
            user_address: The user's address
            
        Returns:
            The total stake amount in microALGO
        """
        stake_key = self._get_stake_key(responsive_donation_app_id, event_id, user_address)
        
        return self.user_stakes[stake_key] if stake_key in self.user_stakes else arc4.UInt64(0)