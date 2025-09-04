# dCharity

This starter full stack project has been generated using AlgoKit. See below for default getting started instructions.

## Setup
### Initial Setup

1. **Clone the repository** to your local machine.
2. **Install and start [Docker](https://www.docker.com/)**, then set up `AlgoKit` by following the [installation guide](https://github.com/algorandfoundation/algokit-cli#install).
3. In your project directory, run `algokit localnet start` to launch a local Algorand network.
4. Initialize your environment by running `algokit project bootstrap all`. This will install all required dependencies, configure a Python virtual environment, and generate your `.env` file.
5. Build the smart contracts by executing `algokit project run build` inside `/projects/reactive-alturism-contracts`. This step compiles your contracts and prepares them for deployment.
6. Deploy the contracts locally by running `algokit project deploy localnet` in the same directory.
7. Start the frontend server by running `npm run dev` inside `/projects/reactive-alturism-frontend`.

> This project is structured as a monorepo, refer to the [documentation](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/features/project/run.md) to learn more about custom command orchestration via `algokit project run`.

### Subsequently

1. If you update to the latest source code and there are new dependencies, you will need to run `algokit project bootstrap all` again.
2. Follow step 3 above.

### Continuous Integration / Continuous Deployment (CI/CD)

This project uses [GitHub Actions](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions) to define CI/CD workflows, which are located in the [`.github/workflows`](./.github/workflows) folder. You can configure these actions to suit your project's needs, including CI checks, audits, linting, type checking, testing, and deployments to TestNet.

For pushes to `main` branch, after the above checks pass, the following deployment actions are performed:
  - The smart contract(s) are deployed to TestNet using [AlgoNode](https://algonode.io).
  - The frontend application is deployed to a provider of your choice (Netlify, Vercel, etc.). See [frontend README](frontend/README.md) for more information.

> Please note deployment of smart contracts is done via `algokit deploy` command which can be invoked both via CI as seen on this project, or locally. For more information on how to use `algokit deploy` please see [AlgoKit documentation](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/features/deploy.md).

## Tools

This project makes use of Python and React to build Algorand smart contracts and to provide a base project configuration to develop frontends for your Algorand dApps and interactions with smart contracts. The following tools are in use:

- Algorand, AlgoKit, and AlgoKit Utils
- Python dependencies including Poetry, Black, Ruff or Flake8, mypy, pytest, and pip-audit
- React and related dependencies including AlgoKit Utils, Tailwind CSS, daisyUI, use-wallet, npm, jest, playwright, Prettier, ESLint, and Github Actions workflows for build validation

### VS Code

It has also been configured to have a productive dev experience out of the box in [VS Code](https://code.visualstudio.com/), see the [backend .vscode](./backend/.vscode) and [frontend .vscode](./frontend/.vscode) folders for more details.

## Integrating with smart contracts and application clients

Refer to the [fractional-realestate-py-contracts](projects/fractional-realestate-py-contracts/README.md) folder for overview of working with smart contracts, [projects/fractional-realestate-py-frontend](projects/fractional-realestate-py-frontend/README.md) for overview of the React project and the [projects/fractional-realestate-py-frontend/contracts](projects/fractional-realestate-py-frontend/src/contracts/README.md) folder for README on adding new smart contracts from backend as application clients on your frontend. The templates provided in these folders will help you get started.
When you compile and generate smart contract artifacts, your frontend component will automatically generate typescript application clients from smart contract artifacts and move them to `frontend/src/contracts` folder, see [`generate:app-clients` in package.json](projects/fractional-realestate-py-frontend/package.json). Afterwards, you are free to import and use them in your frontend application.

The frontend starter also provides an example of interactions with your FractionalRealEstateClient in [`AppCalls.tsx`](projects/fractional-realestate-py-frontend/src/components/AppCalls.tsx) component by default.

## Explore the Blockchain

run `algokit explore` to see the blockchain live in action

## Next Steps

You can take this project and customize it to build your own decentralized applications on Algorand. Make sure to understand how to use AlgoKit and how to write smart contracts for Algorand before you start.
