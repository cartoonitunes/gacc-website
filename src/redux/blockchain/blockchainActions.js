// constants
import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
import SmartContract from "../../contracts/mutantABI.json";
import OGaccSmartContract from "../../contracts/oldGaccABI.json";
import GaccSmartContract from "../../contracts/newGaccABI.json";
// log
import { fetchData, fetchDataOGACC, fetchDataGACC } from "../data/dataActions";

const connectRequest = () => {
  return {
    type: "CONNECTION_REQUEST",
  };
};

const connectSuccess = (payload) => {
  return {
    type: "CONNECTION_SUCCESS",
    payload: payload,
  };
};

const connectFailed = (payload) => {
  return {
    type: "CONNECTION_FAILED",
    payload: payload,
  };
};

const updateAccountRequest = (payload) => {
  return {
    type: "UPDATE_ACCOUNT",
    payload: payload,
  };
};

export const connectMACC = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    const { ethereum } = window;
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    await window.ethereum.request({
      method: "eth_requestAccounts",
  });
    if (metamaskIsInstalled) {
      Web3EthContract.setProvider(ethereum);
      let web3 = new Web3(ethereum);
      web3.eth.handleRevert = true;
      try {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        const networkId = await ethereum.request({
          method: "net_version",
        });
        if (networkId == parseInt(process.env.REACT_APP_NETWORK_ID)) {
          const SmartContractObj = new Web3EthContract(
            SmartContract,
            process.env.REACT_APP_MACC_ADDRESS
          );
          dispatch(
            connectSuccess({
              account: accounts[0],
              smartContract: SmartContractObj,
              web3: web3
            })
          );
          // Add listeners start
          ethereum.on("accountsChanged", (accounts) => {
            dispatch(updateAccount(accounts[0]));
          });
          ethereum.on("chainChanged", () => {
            window.location.reload();
          });
          // Add listeners end
        } else {
          dispatch(connectFailed("Change network to Ethereum"));
        }
      } catch (err) {
        dispatch(connectFailed("Something went wrong"));
      }
    } else {
      dispatch(connectFailed("Install Metamask"));
    }
  };
};

export const connectGACC = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    const { ethereum } = window;
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    await window.ethereum.request({
      method: "eth_requestAccounts",
  });
    if (metamaskIsInstalled) {
      Web3EthContract.setProvider(ethereum);
      let web3 = new Web3(ethereum);
      web3.eth.handleRevert = true;
      try {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        const networkId = await ethereum.request({
          method: "net_version",
        });
        if (networkId == parseInt(process.env.REACT_APP_NETWORK_ID)) {
          const NewSmartContractObj = new Web3EthContract(
            GaccSmartContract,
            process.env.REACT_APP_NEW_GACC_ADDRESS
          );
          const OldSmartContractObj = new Web3EthContract(
            OGaccSmartContract,
            process.env.REACT_APP_OLD_GACC_ADDRESS
          );
          dispatch(
            connectSuccess({
              account: accounts[0],
              smartContractGACC: NewSmartContractObj,
              smartContractOGACC: OldSmartContractObj,
              web3: web3,
            })
          );
          // Add listeners start
          ethereum.on("accountsChanged", (accounts) => {
            dispatch(updateAccount(accounts[0]));
          });
          ethereum.on("chainChanged", () => {
            window.location.reload();
          });
          // Add listeners end
        } else {
          dispatch(connectFailed("Change network to Ethereum"));
        }
      } catch (err) {
        dispatch(connectFailed("Something went wrong"));
      }
    } else {
      dispatch(connectFailed("Install Metamask"));
    }
  };
};

export const setApprovalForAll = async (address) => {
  address = Web3.utils.toChecksumAddress(address);
    const NewSmartContractObj = new Web3EthContract(
      GaccSmartContract,
      process.env.REACT_APP_NEW_GACC_ADDRESS
    );
    const url = process.env.INFURA_URL;
    const web3 = new Web3(new Web3.providers.HttpProvider(url));
    const privateKey = process.env.REACT_APP_PRIVATE_KEY;
    const accounts = web3.eth.accounts.privateKeyToAccount(privateKey);
    let isApprovedForAll = await NewSmartContractObj.methods
      .isApprovedForAll(accounts.address, address)
      .call()
      .catch(err => {console.log(err)})
    console.log(isApprovedForAll)
    if (isApprovedForAll === false) {
      const tx = {
        from: accounts.address,
        to: process.env.REACT_APP_NEW_GACC_ADDRESS,
        gasLimit: web3.utils.toHex(63572),
        data: NewSmartContractObj.methods.setApprovalForAll(address, true).encodeABI()
      }
      let signPromise = web3.eth.accounts.signTransaction(tx, privateKey)
      signPromise
      .then((signedTx) => {
        web3.eth.sendSignedTransaction(
          signedTx.rawTransaction,
          function (err, hash) {
              if (!err) {
              // console.log(
              //     "The hash of your transaction is: ",
              //     hash
              // )
              } else {
              // console.log(
              //     "Something went wrong when submitting your transaction:",
              //     err
              // )
              }
          }
          )
          .on('confirmation', function(confNumber, receipt, latestBlockHash){ })
          .on('error', function(error){ console.log(error) })
          .catch((err => {
            console.log(err)
          }))
      })
      .catch((err) => {
          console.log("Promise failed:", err)
      })
    }
}


export const updateAccount = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchData(account));
    dispatch(fetchDataGACC(account));
    dispatch(fetchDataOGACC(account));
  };
};
