// script.js

const ZNCT_ADDRESS = '0x27cF9bc61B29f893571b5cC1c2ae5162feB8C158';
const PAIR_ADDRESS = '0x454CD7D3e07777abF13499100DFcc43b049f2afe'; // SimplePair deployed address
const NFT_ADDRESS = '0x6661E0C72d7Aaed6016c4F70016c51AD8995bb08'; // TeaNFT deployed address

// ERC-20 ABI (for ZNCT and TeaToken)
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)'
];

// ERC-721 ABI (for TeaNFT and BasicNFT)
const ERC721_ABI = [
  'function safeMint(address to, string memory tokenURI) public returns (uint256)',
  'function tokenURI(uint256 tokenId) public view returns (string memory)'
];

// SimplePair ABI (for swap and liquidity)
const PAIR_ABI = [
  'function addLiquidity(uint256 tokenAmount) public payable',
  'function removeLiquidity(uint256 tokenAmount, uint256 ethAmount) public',
  'function swapTokensForETH(uint256 tokenAmount) public',
  'function getETHAmount(uint256 tokenAmount) public pure returns (uint256)'
];

// Network configuration
const TEA_SEPOLIA = {
  chainId: '0x27EA', // 10218 in hex
  chainName: 'Tea Sepolia',
  rpcUrls: ['https://tea-sepolia.g.alchemy.com/public'],
  nativeCurrency: {
    name: 'TEA',
    symbol: 'TEA',
    decimals: 18
  },
  blockExplorerUrls: ['https://sepolia.tea.xyz']
};

let provider, signer, walletAddress;

// Utility function to validate Ethereum address
function isValidAddress(address) {
  return ethers.utils.isAddress(address);
}

// Connect Wallet
async function connectWallet() {
  if (window.ethereum) {
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      signer = provider.getSigner();
      walletAddress = await signer.getAddress();
      document.getElementById('walletAddress').textContent = `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

      // Switch to Tea Sepolia
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: TEA_SEPOLIA.chainId }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [TEA_SEPOLIA]
          });
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error('Connection failed:', error);
      alert(`Failed to connect wallet: ${error.message}`);
    }
  } else {
    alert('Please install MetaMask');
  }
}

// Transfer ZNCT
async function transferZNCT() {
  if (!signer) return alert('Please connect wallet');
  const toAddress = document.getElementById('transferAddress').value;
  const amount = document.getElementById('transferAmount').value;
  if (!toAddress || !amount) return alert('Please fill all fields');
  if (!isValidAddress(toAddress)) return alert('Invalid recipient address');
  if (amount <= 0) return alert('Amount must be greater than 0');

  try {
    const contract = new ethers.Contract(ZNCT_ADDRESS, ERC20_ABI, signer);
    const tx = await contract.transfer(toAddress, ethers.utils.parseEther(amount));
    await tx.wait();
    alert('Transfer successful');
  } catch (error) {
    console.error('Transfer failed:', error);
    alert(`Transfer failed: ${error.reason || error.message}`);
  }
}

// Swap ZNCT for TEA
async function swapZNCTforTEA() {
  if (!signer) return alert('Please connect wallet');
  const amount = document.getElementById('swapAmount').value;
  if (!amount) return alert('Please enter amount');
  if (amount <= 0) return alert('Amount must be greater than 0');

  try {
    const contract = new ethers.Contract(ZNCT_ADDRESS, ERC20_ABI, signer);
    const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, signer);
    const amountIn = ethers.utils.parseEther(amount);

    await contract.approve(PAIR_ADDRESS, amountIn);
    const tx = await pair.swapTokensForETH(amountIn);
    await tx.wait();
    alert('Swap successful');
  } catch (error) {
    console.error('Swap failed:', error);
    alert(`Swap failed: ${error.reason || error.message}`);
  }
}

// Mint NFT
async function mintNFT() {
  if (!signer) return alert('Please connect wallet');
  const tokenURI = document.getElementById('nftTokenURI').value;
  if (!tokenURI) return alert('Please enter token URI');

  try {
    const contract = new ethers.Contract(NFT_ADDRESS, ERC721_ABI, signer);
    const tx = await contract.safeMint(walletAddress, tokenURI);
    await tx.wait();
    alert('NFT minted');
  } catch (error) {
    console.error('Mint failed:', error);
    alert(`Mint failed: ${error.reason || error.message}`);
  }
}

// Deploy Contract
async function deployContract() {
  if (!signer) return alert('Please connect wallet');
  const contractType = document.getElementById('contractType').value;

  try {
    let abi, bytecode;
    if (contractType === 'erc20') {
      abi = ERC20_ABI;
      bytecode = '0x608060405234801561001057600080fd5b50604051610e8c380380610e8c8281610160565b81019061001f906101b3565b506003805461010060a060020a031916610100600160a060020a031617905561010060a060020a03196000908190610280565b6102ae565b60008083601f84011261003c57600080fd5b50813567ffffffffffffffff81111561005457600080fd5b60208301915083602082850101111561006c57600080fd5b9250929050565b60008083601f84011261008557600080fd5b50813567ffffffffffffffff81111561009d57600080fd5b6020830191508360208260061b85010111156106c57600080fd5b9250929050565b60008060006040848603121561014957600080fd5b833561015481610119565b9250602084013561016481610119165b809150509250925092565b60008060006060848603121561017b57600080fd5b833561018681610119565b9250602084013561019681610119165b808211156101a757600080fd5b818601915086601f8301126101bb57600080fd5b8135818111156101c957600080fd5b8760208285010111156101db57600080fd5b6020830194508093505050509250925092565b6000806000806080858703121561020457600080fd5b61020e85610134565b935061021c60208601610134565b9250604085013567ffffffffffffffff81111561023857600080fd5b610244878288016101ed565b92505061025360608601610134565b905092959194509250565b610100600160a060020a038116811461013157600080fd5b60006020828403121561028f57600080fd5b813561029a81610260565b9392505050565b6000602082840312156102c057600080fd5b815161029a81610260565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff81118282101715610304576103046102cb565b604052917bfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016820160405261033e9190610342565b90565b600067ffffffffffffffff82111561035c5761035c6102cb565b50601f01601f191660200190565b6000602080838503121561037d57600080fd5b825167ffffffffffffffff81111561039457600080fd5b8301601f810185136103a557600080fd5b80516103b361033e82610346565b8181528560208385010111156103c857600080fd5b6103d98260208301602086016106e2565b50949350505050565b6000602082840312156103f457600080fd5b5035919050565b60008083601f84011261040d57600080fd5b50813567ffffffffffffffff81111561042557600080fd5b60208301915083602082850101111561043d57600080fd5b9250929050565b60008060006040848603121561045957600080fd5b833561046481610260565b9250602084013567ffffffffffffffff81111561048057600080fd5b61048c868287016103fb565b509095945050505050565b60008083601f8401126104af57600080fd5b50813567ffffffffffffffff8111156104c757600080fd5b6020830191508360208260061b85010111156104e257600080fd5b9250929050565b6000806000806060858703121561050057600080fd5b61050a856103fb565b9350610518602086016103fb565b9250604085013567ffffffffffffffff81111561053457600080fd5b6105408782880161049d565b509095945050505050565b6000806040838503121561055e57600080fd5b823561056981610260565b9150602083013561057981610260565b809150509250929050565b60008083601f84011261059657600080fd5b50813567ffffffffffffffff8111156105ae57600080fd5b6020830191508360208260061b85010111156105c957600080fd5b9250929050565b600080600080606085870312156105e757600080fd5b6105f18561057c565b93506105ff6020860161057c565b9250604085013567ffffffffffffffff81111561061b57600080fd5b61062787828801610584565b509095945050505050565b60008083601f84011261064857600080fd5b50813567ffffffffffffffff81111561066057600080fd5b60208301915083602082850101111561067857600080fd5b9250929050565b60008060006040848603121561069057600080fd5b833561069b81610260565b9250602084013567ffffffffffffffff8111156106b757600080fd5b6106c386828701610636565b509095945050505050565b60005b838110156106fd5781810151838201526020016106e5565b8381111561070c576000848401525b50505050565b6000815180845261072a8160208601602086016106e2565b601f01601f19169290920160200192915050565b60208152600061029a6020830184610712565b60006020828403121561076357600080fd5b815161076e81610260565b9392505050565b6000806040838503121561078857600080fd5b823561079381610260565b946020939093013593505050565b6000806000606084860312156107b657600080fd5b83356107c181610260565b925060208401356107d181610260565b929592945050506040919091013590565b600080604083850312156107f957600080fd5b823561080481610260565b91506020830135801515811461081957600080fd5b809150509250929050565b6000806040838503121561083c57600080fd5b823561084781610260565b9150602083013561085781610260565b809150509250929050565b6000806040838503121561087a57600080fd5b823561088581610260565b9150602083013561089581610260565b809150509250929050565b634e487b7160e01b600052600160045260246000fd5b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b6000828210156108e2576108e26108c3565b500390565b600181815b8085111561092257610915816108c3565b8085161561092257918102915b93841c9390800290610906565b509250929050565b60008261093b57600161093b6108c3565b60018201915080821115610951576109516108c3565b50919050565b6000610967828461092a565b9392505050565b6000816000190483118215151615610989576109896108d7565b500290565b600061099e838361092a565b9392505050565b60006109b0838361092a565b9392505050565b600081815260208120601f850160051c810160208610156109da576109da6108ed565b601f01601f191681010390565b6109f18160405190565b92915050565b600060208284031215610a0957600080fd5b61029a826109e7565b600060208284031215610a2557600080fd5b8151801515811461029a57600080fd5b600060208284031215610a4b57600080fd5b815161029a81610260565b60008060408385031215610a6e57600080fd5b610a78836109e7565b9150610a86602084016109e7565b90509250929050565b60008060408385031215610aa257600080fd5b610aac836109e7565b9150602083015163ffffffff81168114610ac657600080fd5b809150509250929050565b60008060408385031215610ae857600080fd5b610af2836109e7565b946020939093013593505050565b60008060408385031215610b1857600080fd5b610b22836109e7565b9150610b30602084016109e7565b90509250929050565b600181811c90821680610b5257607f821691505b602082108103610b7257634e487b7160e01b600052602260045260246000fd5b50919050565b600060208284031215610b8a57600080fd5b61029a826109e7565b6000808284036020811215610ba957600080fd5b6040516020810181811067ffffffffffffffff82111715610bc957610bc96102cb565b604052835160208501519150509250929050565b600060208 CNR2560 fd5b6040516020810181811067ffffffffffffffff82111715610c1557610c156102cb565b60405281516020018190525050919050565b600060208284031215610c3f57600080fd5b6040516020810181811067ffffffffffffffff82111715610c5f57610c5f6102cb565b60405281516020018190525050919050565b600060208284031215610c8957600080fd5b6040516020810181811067ffffffffffffffff82111715610ca957610ca96102cb565b60405281516020018190525050919050565b600060208284031215610cd357600080fd5b6040516020810181811067ffffffffffffffff82111715610cf357610cf36102cb565b60405281516020018190525050919050565b600060208284031215610d1d57600080fd5b6040516020810181811067ffffffffffffffff82111715610d3d57610d3d6102cb565b60405281516020018190525050919050565b600060208284031215610d6757600080fd5b6040516020810181811067ffffffffffffffff82111715610d8757610d876102cb565b60405281516020018190525050919050565b600060208284031215610db157600080fd5b6040516020810181811067ffffffffffffffff82111715610dd157610dd16102cb565b60405281516020018190525050919050565b600060208284031215610dfb57600080fd5b6040516020810181811067ffffffffffffffff82111715610e1b57610e1b6102cb565b60405281516020018190525050919050565b600060208284031215610e4557600080fd5b6040516020810181811067ffffffffffffffff82111715610e6557610e656102cb565b60405281516020018190525050919050565b6107b780610e7b6000396000f3fe'; // TeaToken bytecode
    } else {
      abi = ERC721_ABI;
      bytecode = '0x608060405234801561001057600080fd5b506040516110d83803806110d88281610160565b81019061001f906101b3565b506003805461010060a060020a031916610100600160a060020a031617905561010060a060020a03196000908190610280565b6102ae565b60008083601f84011261003c57600080fd5b50813567ffffffffffffffff81111561005457600080fd5b60208301915083602082850101111561006c57600080fd5b9250929050565b60008083601f84011261008557600080fd5b50813567ffffffffffffffff81111561009d57600080fd5b6020830191508360208260061b85010111156106c57600080fd5b9250929050565b60008060006040848603121561014957600080fd5b833561015481610119565b9250602084013561016481610119165b809150509250925092565b60008060006060848603121561017b57600080fd5b833561018681610119565b9250602084013561019681610119165b808211156101a757600080fd5b818601915086601f8301126101bb57600080fd5b8135818111156101c957600080fd5b8760208285010111156101db57600080fd5b6020830194508093505050509250925092565b6000806000806080858703121561020457600080fd5b61020e85610134565b935061021c60208601610134565b9250604085013567ffffffffffffffff81111561023857600080fd5b610244878288016101ed565b92505061025360608601610134565b905092959194509250565b610100600160a060020a038116811461013157600080fd5b60006020828403121561028f57600080fd5b813561029a81610260565b9392505050565b6000602082840312156102c057600080fd5b815161029a81610260565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff81118282101715610304576103046102cb565b604052917bfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016820160405261033e9190610342565b90565b600067ffffffffffffffff82111561035c5761035c6102cb565b50601f01601f191660200190565b6000602080838503121561037d57600080fd5b825167ffffffffffffffff81111561039457600080fd5b8301601f810185136103a557600080fd5b80516103b361033e82610346565b8181528560208385010111156103c857600080fd5b6103d98260208301602086016106e2565b50949350505050565b6000602082840312156103f457600080fd5b5035919050565b60008083601f84011261040d57600080fd5b50813567ffffffffffffffff81111561042557600080fd5b60208301915083602082850101111561043d57600080fd5b9250929050565b60008060006040848603121561045957600080fd5b833561046481610260565b9250602084013567ffffffffffffffff81111561048057600080fd5b61048c868287016103fb565b509095945050505050565b60008083601f8401126104af57600080fd5b50813567ffffffffffffffff8111156104c757600080fd5b6020830191508360208260061b85010111156104e257600080fd5b9250929050565b6000806000806060858703121561050057600080fd5b61050a856103fb565b9350610518602086016103fb565b9250604085013567ffffffffffffffff81111561053457600080fd5b6105408782880161049d565b509095945050505050565b6000806040838503121561055e57600080fd5b823561056981610260565b9150602083013561057981610260565b809150509250929050565b60008083601f84011261059657600080fd5b50813567ffffffffffffffff8111156105ae57600080fd5b6020830191508360208260061b85010111156105c957600080fd5b9250929050565b600080600080606085870312156105e757600080fd5b6105f18561057c565b93506105ff6020860161057c565b9250604085013567ffffffffffffffff81111561061b57600080fd5b61062787828801610584565b509095945050505050565b60008083601f84011261064857600080fd5b50813567ffffffffffffffff81111561066057600080fd5b60208301915083602082850101111561067857600080fd5b9250929050565b60008060006040848603121561069057600080fd5b833561069b81610260565b9250602084013567ffffffffffffffff8111156106b757600080fd5b6106c386828701610636565b509095945050505050565b60005b838110156106fd5781810151838201526020016106e5565b8381111561070c576000848401525b50505050565b6000815180845261072a8160208601602086016106e2565b601f01601f19169290920160200192915050565b60208152600061029a6020830184610712565b60006020828403121561076357600080fd5b815161076e81610260565b9392505050565b6000806040838503121561078857600080fd5b823561079381610260565b946020939093013593505050565b6000806000606084860312156107b657600080fd5b83356107c181610260565b925060208401356107d181610260565b929592945050506040919091013590565b600080604083850312156107f957600080fd5b823561080481610260565b91506020830135801515811461081957600080fd5b809150509250929050565b6000806040838503121561083c57600080fd5b823561084781610260565b9150602083013561085781610260565b809150509250929050565b6000806040838503121561087a57600080fd5b823561088581610260565b9150602083013561089581610260565b809150509250929050565b634e487b7160e01b600052600160045260246000fd5b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b6000828210156108e2576108e26108c3565b500390565b600181815b8085111561092257610915816108c3565b8085161561092257918102915b93841c9390800290610906565b509250929050565b60008261093b57600161093b6108c3565b60018201915080821115610951576109516108c3565b50919050565b6000610967828461092a565b9392505050565b6000816000190483118215151615610989576109896108d7565b500290565b600061099e838361092a565b9392505050565b60006109b0838361092a565b9392505050565b600081815260208120601f850160051c810160208610156109da576109da6108ed565b601f01601f191681010390565b6109f18160405190565b92915050565b600060208284031215610a0957600080fd5b61029a826109e7565b600060208284031215610a2557600080fd5b8151801515811461029a57600080fd5b600060208284031215610a4b57600080fd5b815161029a81610260565b60008060408385031215610a6e57600080fd5b610a78836109e7565b9150610a86602084016109e7565b90509250929050565b60008060408385031215610aa257600080fd5b610aac836109e7565b9150602083015163ffffffff81168114610ac657600080fd5b809150509250929050565b60008060408385031215610ae857600080fd5b610af2836109e7565b946020939093013593505050565b60008060408385031215610b1857600080fd5b610b22836109e7565b9150610b30602084016109e7565b90509250929050565b600181811c90821680610b5257607f821691505b602082108103610b7257634e487b7160e01b600052602260045260246000fd5b50919050565b600060208284031215610b8a57600080fd5b61029a826109e7565b6000808284036020811215610ba957600080fd5b6040516020810181811067ffffffffffffffff82111715610bc957610bc96102cb565b604052835160208501519150509250929050565b600060208284031215610bf557600080fd5b6040516020810181811067ffffffffffffffff82111715610c1557610c156102cb565b60405281516020018190525050919050565b600060208284031215610c3f57600080fd5b6040516020810181811067ffffffffffffffff82111715610c5f57610c5f6102cb565b60405281516020018190525050919050565b600060208284031215610c8957600080fd5b6040516020810181811067ffffffffffffffff82111715610ca957610ca96102cb565b60405281516020018190525050919050565b600060208284031215610cd357600080fd5b6040516020810181811067ffffffffffffffff82111715610cf357610cf36102cb565b60405281516020018190525050919050565b600060208284031215610d1d57600080fd5b6040516020810181811067ffffffffffffffff82111715610d3d57610d3d6102cb565b60405281516020018190525050919050565b600060208284031215610d6757600080fd5b6040516020810181811067ffffffffffffffff82111715610d8757610d876102cb565b60405281516020018190525050919050565b600060208284031215610db157600080fd5b6040516020810181811067ffffffffffffffff82111715610dd157610dd16102cb565b60405281516020018190525050919050565b600060208284031215610dfb57600080fd5b6040516020810181811067ffffffffffffffff82111715610e1b57610e1b6102cb565b60405281516020018190525050919050565b600060208284031215610e4557600080fd5b6040516020810181811067ffffffffffffffff82111715610e6557610e656102cb565b60405281516020018190525050919050565b600060208284031215610e8f57600080fd5b6040516020810181811067ffffffffffffffff82111715610eaf57610eaf6102cb565b60405281516020018190525050919050565b600060208284031215610ed957600080fd5b6040516020810181811067ffffffffffffffff82111715610ef957610ef96102cb565b60405281516020018190525050919050565b600060208284031215610f2357600080fd5b6040516020810181811067ffffffffffffffff82111715610f4357610f436102cb565b60405281516020018190525050919050565b600060208284031215610f6d57600080fd5b6040516020810181811067ffffffffffffffff82111715610f8d57610f8d6102cb565b60405281516020018190525050919050565b600060208284031215610fb757600080fd5b6040516020810181811067ffffffffffffffff82111715610fd757610fd76102cb565b60405281516020018190525050919050565b60006020828403121561100157600080fd5b6040516020810181811067ffffffffffffffff82111715611021576110216102cb565b60405281516020018190525050919050565b60006020828403121561104b57600080fd5b6040516020810181811067ffffffffffffffff8211171561106b5761106b6102cb565b60405281516020018190525050919050565b60006020828403121561109557600080fd5b6040516020810181811067ffffffffffffffff821117156110b5576110b56102cb565b60405281516020018190525050919050565b6110d1600080fd5b6110c1806110df6000396000f3fe'; // BasicNFT bytecode
    }

    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy();
    await contract.deployTransaction.wait();
    alert(`Contract deployed at: ${contract.address}`);
  } catch (error) {
    console.error('Deployment failed:', error);
    alert(`Deployment failed: ${error.reason || error.message}`);
  }
}

// Add Liquidity
async function addLiquidity() {
  if (!signer) return alert('Please connect wallet');
  const znctAmount = document.getElementById('lpZNCTAmount').value;
  const teaAmount = document.getElementById('lpTEAAmount').value;
  if (!znctAmount || !teaAmount) return alert('Please fill all fields');
  if (znctAmount <= 0 || teaAmount <= 0) return alert('Amounts must be greater than 0');

  try {
    const contract = new ethers.Contract(ZNCT_ADDRESS, ERC20_ABI, signer);
    const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, signer);
    const amountToken = ethers.utils.parseEther(znctAmount);
    const amountETH = ethers.utils.parseEther(teaAmount);

    await contract.approve(PAIR_ADDRESS, amountToken);
    const tx = await pair.addLiquidity(amountToken, { value: amountETH });
    await tx.wait();
    alert('Liquidity added');
  } catch (error) {
    console.error('Add liquidity failed:', error);
    alert(`Add liquidity failed: ${error.reason || error.message}`);
  }
}

// Remove Liquidity
async function removeLiquidity() {
  if (!signer) return alert('Please connect wallet');
  const znctAmount = document.getElementById('lpZNCTAmount').value;
  const teaAmount = document.getElementById('lpTEAAmount').value;
  if (!znctAmount || !teaAmount) return alert('Please fill all fields');
  if (znctAmount <= 0 || teaAmount <= 0) return alert('Amounts must be greater than 0');

  try {
    const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, signer);
    const tokenAmount = ethers.utils.parseEther(znctAmount);
    const ethAmount = ethers.utils.parseEther(teaAmount);
    const tx = await pair.removeLiquidity(tokenAmount, ethAmount);
    await tx.wait();
    alert('Liquidity removed');
  } catch (error) {
    console.error('Remove liquidity failed:', error);
    alert(`Remove liquidity failed: ${error.reason || error.message}`);
  }
}