import './App.css';
import react, { useEffect, useState } from 'react'
import  { ethers } from 'ethers'
import artifacts from './artifacts/contracts/Staking.sol/Staking.json'

const CONTRACT_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F'

function App() {
  // general
  const [provider, setProvider] = useState(undefined)
  const [signer, setSigner] = useState(undefined)
  const [constract, setContract] = useState(undefined)
  const [signerAddress, setSignerAddress] = useState(undefined)
  
  // assets
  const [assetIds, setAssetIds] = useState([])
  const [assets, setAssets] = useState([])

  // staking
  const [showStakeModel, setShowStakeModel] = useState(false)
  const [stakingLength, setStakingLength] = useState(undefined)
  const [stakingPercent, setStakingPercent] = useState(undefined)
  const [amount, setAmount] = useState(0)

  // helper
  const toString = bytes32 => ethers.utils.parseBytes32String(bytes32)
  const toWei = ether => ethers.utils.parseEther(ether)
  const toEther = wei => ethers.utils.formatEther(wei)


  return (
    <div className="App">
      
    </div>
  );
}

export default App;
