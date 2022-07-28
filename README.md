## SetUp Project

- Clone the project:
```
git clone repo_link
```
- Install the dependencies:
```
npm i
```
- Run the tests:
```
npm test
```
- Compile the contracts:
```
npm run compile
```

- Run on local node:
```
npx hardhat node
npx hardhat run --network localhost scripts/deploy.js
```
- Connect MetaMask to the local node

- Update client__App.js:
```
const CONTRACT_ADDRESS = <DEPLOYED_SC_ADDRESS>
```

- Run client:
```
npm start
```
