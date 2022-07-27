const { waffle } = require("hardhat");

async function main() {
  [owner, signer1, signer2, _] = await ethers.getSigners()

  Staking = await ethers.getContractFactory('Staking')
  staking = await Staking.deploy({ value: ethers.utils.parseEther('10') })

  console.log("Staking contract deployed to: ", staking.address, "by ", owner.address);

  const provider = waffle.provider
  let data
  let transaction
  let receipt
  let block
  let newUnlockDate

  data = { value: ethers.utils.parseEther('0.5') }
  transaction = await staking.connect(signer1).stakeEther(30, data)

  data = { value: ethers.utils.parseEther('1') }
  transaction = await staking.connect(signer1).stakeEther(180, data)

  data = { value: ethers.utils.parseEther('1.75') }
  transaction = await staking.connect(signer1).stakeEther(180, data)

  data = { value: ethers.utils.parseEther('5') }
  transaction = await staking.connect(signer1).stakeEther(90, data)
  receipt = await transaction.wait()
  block = await provider.getBlock(receipt.blockNumber)
  newUnlockDate = block.timestamp - (60 * 60 * 24 * 100)
  await staking.connect(owner).changeUnlockDate(3, newUnlockDate)

  data = { value: ethers.utils.parseEther('1.75') }
  transaction = await staking.connect(signer1).stakeEther(180, data)
  receipt = await transaction.wait()
  block = await provider.getBlock(receipt.blockNumber)
  newUnlockDate = block.timestamp - (60 * 60 * 24 * 100)
  await staking.connect(owner).changeUnlockDate(4, newUnlockDate)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
