// log
import store from "../store";

const fetchDataRequest = () => {
  return {
    type: "CHECK_DATA_REQUEST",
  };
};

const fetchDataSuccess = (payload) => {
  return {
    type: "CHECK_DATA_SUCCESS",
    payload: payload,
  };
};

const fetchDataFailed = (payload) => {
  return {
    type: "CHECK_DATA_FAILED",
    payload: payload,
  };
};

export const fetchData = () => {
  return async (dispatch) => {
    dispatch(fetchDataRequest());
    try {
      let name = await store
        .getState()
        .blockchain.smartContract.methods.name()
        .call();
      let totalSupply = await store
        .getState()
        .blockchain.smartContract.methods.totalSupply()
        .call();
      let wlPrice = await store
        .getState()
        .blockchain.smartContract.methods.WL_PRICE()
        .call();
      let apesMinted = await store
        .getState()
        .blockchain.smartContract.methods.apesMinted()
        .call();
      let saleFreeWhitelistActive = await store
        .getState()
        .blockchain.smartContract.methods.saleFreeWhitelistActive()
        .call();
      let saleWhitelistActive = await store
        .getState()
        .blockchain.smartContract.methods.saleWhitelistActive()
        .call();
      let publicSaleActive = await store
        .getState()
        .blockchain.smartContract.methods.publicSaleActive()
        .call();
      let serumMutationActive = await store
        .getState()
        .blockchain.smartContract.methods.serumMutationActive()
        .call();
      let remainingSaleTime = 0;
      let currentPrice = 300000000000000000;
      if (publicSaleActive) {
        remainingSaleTime = await store
          .getState()
          .blockchain.smartContract.methods.getRemainingSaleTime()
          .call();
        currentPrice = await store
          .getState()
          .blockchain.smartContract.methods.getMintPrice()
          .call();
      }
      

      dispatch(
        fetchDataSuccess({
          name,
          totalSupply,
          wlPrice,
          apesMinted,
          remainingSaleTime,
          currentPrice,
          saleFreeWhitelistActive,
          saleWhitelistActive,
          publicSaleActive,
          serumMutationActive,
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(fetchDataFailed("Could not load data from contract."));
    }
  };
};

export const fetchKittenData = () => {
  return async (dispatch) => {
    dispatch(fetchDataRequest());
    try {
      let kittenCallActive = await store
        .getState()
        .blockchain.kittenSmartContract.methods.callIsActive()
        .call();

      dispatch(
        fetchDataSuccess({
          kittenCallActive
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(fetchDataFailed("Could not load data from contract."));
    }
  };
};

export const fetchLunagemData = () => {
  return async (dispatch) => {
    dispatch(fetchDataRequest());
    try {
      let lunagemMineActive = await store
        .getState()
        .blockchain.lunagemSmartContract.methods.mineIsActive()
        .call();
      let lunagemSaleActive = await store
        .getState()
        .blockchain.lunagemSmartContract.methods.saleIsActive()
        .call();

      dispatch(
        fetchDataSuccess({
          lunagemMineActive,
          lunagemSaleActive,
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(fetchDataFailed("Could not load data from contract."));
    }
  };
};