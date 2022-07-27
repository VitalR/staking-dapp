const { ethers, waffle } = require("hardhat")
const { expect, assert } = require('chai');
const { BigNumber, utils, provider } = require('ethers');


describe('Staking', function () {
    beforeEach(async function () {
        [owner, signer1, signer2, _] = await ethers.getSigners()

        Staking = await ethers.getContractFactory('Staking')
        staking = await Staking.deploy({ value: ethers.utils.parseEther('10') })
    })

    describe('deploy', function () {
        it('should set owner', async () => {
            expect(await staking.owner()).to.be.equal(owner.address)
        })

        it('sets up tiers and lockPeriods', async () => {
            expect(await staking.lockPeriods(0)).to.equal(30)
            expect(await staking.lockPeriods(1)).to.equal(90)
            expect(await staking.lockPeriods(2)).to.equal(180)

            expect(await staking.tiers(30)).to.equal(700)
            expect(await staking.tiers(90)).to.equal(1000)
            expect(await staking.tiers(180)).to.equal(12000)
        })
    })

    describe('stakeEther', function () {
        it('transfers ether', async () => {
            const provider = waffle.provider
            let contractBalance
            let signerBalance
            const transferAmount = ethers.utils.parseEther('2.0')

            contractBalance = await provider.getBalance(staking.address)
            signerBalance = await signer1.getBalance()

            const data = { value: transferAmount }
            const transaction = await staking.connect(signer1).stakeEther(30, data)
            const receipt = await transaction.wait()
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)

            // test the change in signer1's ether balance
            expect(await signer1.getBalance())
                .to.equal(signerBalance.sub(transferAmount).sub(gasUsed))

            // test the change in contract's ether balance
            expect(await provider.getBalance(staking.address))
                .to.equal(contractBalance.add(transferAmount))
        })

        it('adds a position to positions', async () => {
            const provider = waffle.provider
            let position
            const transferAmount = ethers.utils.parseEther('1.0')

            position = await staking.positions(1)

            expect(position.positionId).to.equal(0)
            expect(position.walletAddress).to.equal('0x0000000000000000000000000000000000000000')
            expect(position.createdDate).to.equal(0)
            expect(position.unlockDate).to.equal(0)
            expect(position.percentInterest).to.equal(0)
            expect(position.weiStaked).to.equal(0)
            expect(position.weiInterest).to.equal(0)
            expect(position.open).to.equal(false)

            expect(await staking.currentPositionId()).to.equal(1)

            data = { value: transferAmount }
            const transaction = await staking.connect(signer1).stakeEther(90, data)
            const receipt = await transaction.wait()
            const block = await provider.getBlock(receipt.blockNumber)

            position = await staking.positions(1)

            expect(position.positionId).to.equal(1)
            expect(position.walletAddress).to.equal(signer1.address)
            expect(position.createdDate).to.equal(block.timestamp)
            expect(position.unlockDate).to.equal(block.timestamp + (86400 * 90))
            expect(position.percentInterest).to.equal(1000)
            expect(position.weiStaked).to.equal(transferAmount)
            expect(position.weiInterest).to.equal( ethers.BigNumber.from(transferAmount).mul(1000).div(10000) )
            expect(position.open).to.equal(true)

            expect(await staking.currentPositionId()).to.equal(2)
        })

        it('adds address and positionId to positionIdsByAddress', async () => {
            const transferAmount = ethers.utils.parseEther('0.5')

            const data = { value: transferAmount }
            await staking.connect(signer1).stakeEther(30, data)
            await staking.connect(signer1).stakeEther(30, data)
            await staking.connect(signer2).stakeEther(90, data)
            
            expect(await staking.positionIdsByAddress(signer1.address, 0)).to.equal(1)
            expect(await staking.positionIdsByAddress(signer1.address, 1)).to.equal(2)
            expect(await staking.positionIdsByAddress(signer2.address, 0)).to.equal(3)
        })
    })

    describe('modifyLockPeriods', function () {
        describe('owner', function () {
            it('should create a new lock period', async () => {
                await staking.connect(owner).modifyLockPeriods(100, 999)

                expect(await staking.tiers(100)).to.equal(999)
                expect(await staking.lockPeriods(3)).to.equal(100)
            })

            it('should modify an existing lock period', async () => {
                expect(await staking.tiers(180)).to.equal(12000)

                await staking.connect(owner).modifyLockPeriods(180, 15000)

                expect(await staking.tiers(180)).to.equal(15000)
            })
        })

        describe('non-owner', function () {
            it('reverts', async () => {
                expect(staking.connect(signer1).modifyLockPeriods(100, 999))
                    .to.be.revertedWith('Ownable: caller is not the owner')
            })
        })
    })

    describe('getLockPeriods', function () {
        it('returns all lock periods', async () => {
            const lockPeriods = await staking.getLockPeriods()

            expect(lockPeriods.map(v => Number(v._hex)))
                .to.eql([30,90,180])
        })
    })

    describe('getInterestRate', function () {
        it('returns the interest rate for a specific lockPeriod', async () => {
            const interestRate = await staking.getInterestRate(30)
            expect(interestRate).to.equal(700)
        })
    })

    describe('getPositionById', function () {
        it('returns data about a specific position, given a positionId', async () => {
            const provider = waffle.provider

            const transferAmount = ethers.utils.parseEther('5')
            const data = { value: transferAmount }
            const transaction = await staking.connect(signer1).stakeEther(90, data)
            const receipt = transaction.wait()
            const block = await provider.getBlock(receipt.blockNumber)

            const position = await staking.connect(signer2).getPositionById(1)

            expect(position.positionId).to.equal(1)
            expect(position.walletAddress).to.equal(signer1.address)
            expect(position.createdDate).to.equal(block.timestamp)
            expect(position.unlockDate).to.equal(block.timestamp + (86400 * 90))
            expect(position.percentInterest).to.equal(1000)
            expect(position.weiStaked).to.equal(transferAmount)
            expect(position.weiInterest).to.equal( ethers.BigNumber.from(transferAmount).mul(1000).div(10000) )
            expect(position.open).to.equal(true)
        })
    })

    describe('getPositionIdsForAddress', function () {
        it('returns a list of positionIds created by a specific address', async () => {
            let data
            let transaction

            data = { value: ethers.utils.parseEther('5') }
            transaction = await staking.connect(signer1).stakeEther(90, data)

            data = { value: ethers.utils.parseEther('10') }
            transaction = await staking.connect(signer1).stakeEther(90, data)

            const positionIds = await staking.getPositionIdsForAddress(signer1.address)

            expect(positionIds.map(p => Number(p))).to.eql([1, 2])
        })
    })

    describe('changeUnlockDate', function () {
        describe('owner', function () {
            it('changes the unlockDate', async () => {
                const data = { value: ethers.utils.parseEther('8') }
                const transaction = await staking.connect(signer1).stakeEther(90, data)
                const positionOld = await staking.getPositionById(1)

                const newUnlockDate = positionOld.unlockDate - (86400 * 500)
                await staking.connect(owner).changeUnlockDate(1, newUnlockDate)
                const positionNew = await staking.getPositionById(1)

                expect(positionNew.unlockDate).to.be.equal(positionOld.unlockDate - (86400 * 500))
            })
        })

        describe('non-owner', function () {
            it('revert', async () => {
                const data = { value: ethers.utils.parseEther('8') }
                const transaction = await staking.connect(signer1).stakeEther(90, data)
                const positionOld = await staking.getPositionById(1)

                const newUnlockDate = positionOld.unlockDate - (86400 * 500)
                expect(staking.connect(signer1).changeUnlockDate(1, newUnlockDate))
                    .to.be.revertedWith('Ownable: caller is not the owner')
            })
        })
    })

    describe('closePosition', function () {
        describe('after unlock date', function () {
            it('transfers principal and interes', async () => {
                const provider = waffle.provider
                const transferAmount = ethers.utils.parseEther('8.0')

                const data = { value: transferAmount }
                let transaction = await staking.connect(signer2).stakeEther(90, data)
                let receipt = transaction.wait()
                let block = await provider.getBlock(receipt.blockNumber)

                const newUnlockDate = block.timestamp - (86400 * 100)
                await staking.connect(owner).changeUnlockDate(1, newUnlockDate)

                const position = await staking.getPositionById(1)

                const signerBalanceBefore = await signer2.getBalance()

                transaction = await staking.connect(signer2).closePosition(1)
                receipt = await transaction.wait()

                const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)
                const signerBalanceAfter = await signer2.getBalance()

                expect(signerBalanceAfter).to.equal(
                    signerBalanceBefore
                        .sub(gasUsed)
                        .add(position.weiStaked)
                        .add(position.weiInterest)
                )
            })
        })

        describe('before unlock date', function () {
            it('transfers only principal', async () => {
                const provider = waffle.provider
                const transferAmount = ethers.utils.parseEther('5.0')

                const data = { value: transferAmount }
                let transaction = await staking.connect(signer2).stakeEther(90, data)
                let receipt = transaction.wait()
                let block = await provider.getBlock(receipt.blockNumber)

                const position = await staking.getPositionById(1)

                const signerBalanceBefore = await signer2.getBalance()

                transaction = await staking.connect(signer2).closePosition(1)
                receipt = await transaction.wait()

                const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)
                const signerBalanceAfter = await signer2.getBalance()

                expect(signerBalanceAfter).to.equal(
                    signerBalanceBefore
                        .sub(gasUsed)
                        .add(position.weiStaked)
                )
            })
        })

        describe('negative', function () {
            it('should revert in case caller in not position creator', async () => {
                const provider = waffle.provider
                const transferAmount = ethers.utils.parseEther('5.0')

                const data = { value: transferAmount }
                await staking.connect(signer2).stakeEther(90, data)

                await expect(staking.connect(owner).closePosition(1))
                    .to.be.revertedWith('Only position creator may modify position')
            })

            it('should revert in case position is already closed', async () => {
                const provider = waffle.provider
                const transferAmount = ethers.utils.parseEther('5.0')

                const data = { value: transferAmount }
                await staking.connect(signer2).stakeEther(90, data)

                await staking.connect(signer2).closePosition(1)
                await expect(staking.connect(signer2).closePosition(1))
                    .to.be.revertedWith('Position is closed')
            })
        })
    })
})