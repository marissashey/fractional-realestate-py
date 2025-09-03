# ResponsiveDonation Frontend Setup Guide

This guide will help you connect the frontend to your deployed ResponsiveDonation smart contract.

## Prerequisites

1. **Deploy the ResponsiveDonation Smart Contract**
   
   First, you need to deploy the contract from the `reactive-altruism-contracts` project:
   
   ```bash
   cd ../reactive-altruism-contracts
   # Deploy to testnet or localnet
   algokit deploy
   ```
   
   After deployment, note down the **App ID** that gets created.

## Environment Configuration

2. **Create Environment File**
   
   Create a `.env` file in the root of the frontend project with the following variables:

   ```env
   # Algorand Node Configuration (TestNet example)
   VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
   VITE_ALGOD_PORT=443
   VITE_ALGOD_TOKEN=
   VITE_ALGOD_NETWORK=testnet

   # Algorand Indexer Configuration
   VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
   VITE_INDEXER_PORT=443
   VITE_INDEXER_TOKEN=

   # ResponsiveDonation Smart Contract App ID
   # Replace with your deployed contract's App ID
   VITE_APP_ID=123456789

   # For LocalNet development (optional):
   # VITE_ALGOD_SERVER=http://localhost
   # VITE_ALGOD_PORT=4001
   # VITE_ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
   # VITE_ALGOD_NETWORK=localnet
   # 
   # VITE_INDEXER_SERVER=http://localhost
   # VITE_INDEXER_PORT=8980
   # VITE_INDEXER_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
   ```

## Generate TypeScript Client

3. **Generate the Contract Client**
   
   The frontend needs the TypeScript client for the ResponsiveDonation contract:
   
   ```bash
   # This will generate the ResponsiveDonation.ts client from the deployed contract
   npm run generate:app-clients
   ```

## Install Dependencies and Run

4. **Install and Start**
   
   ```bash
   npm install
   npm run dev
   ```

## Verification

5. **Test the Connection**
   
   - Open the app at `http://localhost:5173`
   - Connect your wallet (make sure it has some ALGO for testing)
   - Try creating an event in the Oracle tab
   - Try making an instant donation
   - Try creating a conditional donation

## Troubleshooting

### Common Issues:

1. **"App ID not found" error**
   - Make sure `VITE_APP_ID` is set correctly in your `.env` file
   - Verify the contract is deployed to the network you're connecting to

2. **"Contract client not found" error**
   - Run `npm run generate:app-clients` to regenerate the TypeScript client
   - Make sure the contract artifacts are properly generated

3. **Network connection issues**
   - Check your `VITE_ALGOD_SERVER` and `VITE_INDEXER_SERVER` settings
   - For TestNet, use the AlgoNode endpoints shown above
   - For LocalNet, make sure AlgoKit LocalNet is running

4. **Transaction failures**
   - Make sure your wallet has enough ALGO for transactions
   - Check that you're connected to the correct network
   - Verify the contract is deployed and the App ID is correct

### Network Settings:

- **TestNet**: Use AlgoNode public endpoints (shown above)
- **MainNet**: Use `https://mainnet-api.algonode.cloud` and `https://mainnet-idx.algonode.cloud`
- **LocalNet**: Use `http://localhost:4001` and `http://localhost:8980` with AlgoKit

## Features Available

Once connected, you can:

- ✅ **Instant Donations**: Send immediate donations to any address
- ✅ **Conditional Donations**: Create donations that execute based on event outcomes
- ✅ **Event Management**: Create and resolve events (as an oracle)
- ✅ **Donation History**: View and execute your conditional donations
- ✅ **Oracle System**: Browse events and resolve them if you're the designated oracle

## Next Steps

1. Test the basic functionality with small amounts
2. Create some sample events for testing
3. Try the full conditional donation workflow
4. Invite others to test as oracles for your events

Happy donating! 🎯💰
