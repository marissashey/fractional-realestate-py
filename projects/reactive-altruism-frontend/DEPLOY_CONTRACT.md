# 🚀 Deploy ResponsiveDonation Contract

You're getting the "application does not exist" error because the ResponsiveDonation contract hasn't been deployed yet. Here's how to deploy it and get the App ID:

## Step 1: Deploy the Contract

### Option A: Deploy to LocalNet (Recommended for Testing)

1. **Start LocalNet**:
   ```bash
   cd projects/reactive-altruism-contracts
   algokit localnet start
   ```

2. **Deploy the Contract**:
   ```bash
   algokit project deploy localnet
   ```

3. **Note the App ID** from the deployment output. It will look like:
   ```
   📄 ResponsiveDonation (1.0.0) deployed successfully!
   ├ App ID: 1001
   ├ Creator: ABCD...WXYZ
   └ Transaction: EFGH...1234
   ```

### Option B: Deploy to TestNet

1. **Configure TestNet Environment**:
   ```bash
   cd projects/reactive-altruism-contracts
   algokit generate env-file -a target_network testnet
   ```

2. **Fund Your Account**:
   - Get TestNet ALGOs from the [TestNet Dispenser](https://testnet.algoexplorer.io/dispenser)
   - Add your account mnemonic to `.env.testnet`

3. **Deploy to TestNet**:
   ```bash
   algokit project deploy testnet
   ```

## Step 2: Configure Frontend

1. **Create `.env` file** in `projects/reactive-altruism-frontend/`:

   **For LocalNet:**
   ```env
   # LocalNet Configuration
   VITE_ALGOD_SERVER=http://localhost
   VITE_ALGOD_PORT=4001
   VITE_ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
   VITE_ALGOD_NETWORK=localnet

   VITE_INDEXER_SERVER=http://localhost
   VITE_INDEXER_PORT=8980
   VITE_INDEXER_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

   # Replace 1001 with your actual App ID from deployment
   VITE_APP_ID=1001
   ```

   **For TestNet:**
   ```env
   # TestNet Configuration
   VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
   VITE_ALGOD_PORT=443
   VITE_ALGOD_TOKEN=
   VITE_ALGOD_NETWORK=testnet

   VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
   VITE_INDEXER_PORT=443
   VITE_INDEXER_TOKEN=

   # Replace with your actual App ID from deployment
   VITE_APP_ID=YOUR_APP_ID_HERE
   ```

## Step 3: Generate TypeScript Client

```bash
cd projects/reactive-altruism-frontend
npm run generate:app-clients
```

## Step 4: Start the Frontend

```bash
npm run dev
```

## Troubleshooting

### If you get "App ID not found" errors:
1. Double-check your `VITE_APP_ID` in the `.env` file
2. Make sure you're connected to the same network where you deployed
3. Verify the contract deployed successfully

### If deployment fails:
1. Make sure you have enough ALGO in your account
2. Check your network connection
3. For LocalNet, ensure `algokit localnet start` is running

### To check if your contract exists:
- **LocalNet**: Visit `http://localhost:8980/v2/applications/YOUR_APP_ID`
- **TestNet**: Visit `https://testnet-idx.algonode.cloud/v2/applications/YOUR_APP_ID`

## Quick Commands Summary

```bash
# 1. Deploy contract (LocalNet)
cd projects/reactive-altruism-contracts
algokit localnet start
algokit project deploy localnet

# 2. Note the App ID and add to .env file
cd ../reactive-altruism-frontend
echo "VITE_APP_ID=YOUR_APP_ID" >> .env

# 3. Generate client and start
npm run generate:app-clients
npm run dev
```

Once you complete these steps, the "application does not exist" error should be resolved! 🎉
