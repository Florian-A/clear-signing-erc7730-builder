# Clear Signing ERC7730 Builder

## New Features

### GitHub Pull Request Generation

The project now includes functionality to automatically generate a Pull Request on the [LedgerHQ/clear-signing-erc7730-registry](https://github.com/LedgerHQ/clear-signing-erc7730-registry) repository.

Each generated Pull Request automatically includes a summary of the smart contract functions described in the ERC7730 JSON. The system displays:
- Manual descriptions written for each function
- A "*No description provided*" message if no description is available
- Parameter details with their labels and formatting information

### GitHub OAuth Authentication

To use this feature, you need to configure GitHub OAuth authentication:

1. Create a GitHub OAuth App in your GitHub account settings
2. Set the callback URL to `http://localhost:3000/api/github/auth/callback` (for development)
3. Add the client ID and client secret to your environment variables

### Features

- **Generate ERC7730 JSON**: Create ERC7730 clear signing descriptors from contract addresses or ABIs
- **GitHub Authentication**: Secure OAuth integration with GitHub
- **Automatic PR Creation**: 
  - Creates a fork if you don't have push access to the repository
  - Generates a unique branch name to avoid conflicts
  - Adds the ERC7730 JSON file to the registry
  - Creates a Pull Request in your name with a summary of the smart contract functions

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Usage

1. Enter a contract address or ABI
2. Configure the ERC7730 descriptor
3. Click "Generate PR" to create a Pull Request on the registry
4. The PR will include a summary of the smart contract functions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
