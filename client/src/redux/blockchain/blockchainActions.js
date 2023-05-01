// constants
import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
import SmartContract from "../../contracts/mutantABI.json";
import LunagemContract from "../../contracts/lunagemABI.json";
import KittenContract from "../../contracts/kittenABI.json";

// log
import { fetchData, fetchKittenData, fetchLunagemData } from "../data/dataActions";
require("dotenv").config();

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
    //const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    if (window.ethereum) {
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });
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
        // eslint-disable-next-line
        if (networkId == parseInt(process.env.REACT_APP_NETWORK_ID)) {
          const SmartContractObj = new Web3EthContract(
            SmartContract,
            process.env.REACT_APP_MACC_ADDRESS
          );
          dispatch(
            connectSuccess({
              account: accounts[0],
              smartContract: SmartContractObj,
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
      dispatch(connectFailed("Install Metamask or open from your wallet browser"));
    }
  };
};

export const connectLunagem = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    const { ethereum } = window;
    //const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    if (window.ethereum) {
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });
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
        // eslint-disable-next-line
        if (networkId == parseInt(process.env.REACT_APP_NETWORK_ID)) {
          const SmartContractObj = new Web3EthContract(
            LunagemContract,
            process.env.REACT_APP_LUNAGEM_ADDRESS
          );
          dispatch(
            connectSuccess({
              account: accounts[0],
              smartContract: SmartContractObj,
              web3: web3,
            })
          );
          // Add listeners start
          ethereum.on("accountsChanged", (accounts) => {
            dispatch(updateAccountLunagemData(accounts[0]));
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
      dispatch(connectFailed("Install Metamask or open from your wallet browser"));
    }
  };
};

export const connectGAKC = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    const { ethereum } = window;
    //const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    if (window.ethereum) {
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });
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
        // eslint-disable-next-line
        if (networkId == parseInt(process.env.REACT_APP_NETWORK_ID)) {
          const SmartContractObj = new Web3EthContract(
            KittenContract,
            process.env.REACT_APP_KITTEN_ADDRESS
          );
          dispatch(
            connectSuccess({
              account: accounts[0],
              smartContract: SmartContractObj,
              web3: web3,
            })
          );
          // Add listeners start
          ethereum.on("accountsChanged", (accounts) => {
            dispatch(updateAccountKittenData(accounts[0]));
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
      dispatch(connectFailed("Install Metamask or open from your wallet browser"));
    }
  };
};

export const updateAccount = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchData(account));
  };
};

export const updateAccountKittenData = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchKittenData(account));
  };
};

export const updateAccountLunagemData = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchLunagemData(account));
  };
};
