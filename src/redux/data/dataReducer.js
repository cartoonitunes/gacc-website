const initialState = {
  loading: false,
  name: "",
  totalSupply: 0,
  apesMinted: 0,
  remainingSaleTime: 0,
  currentPrice: 0,
  wlPrice: 0,
  saleFreeWhitelistActive: false,
  saleWhitelistActive: false,
  publicSaleActive: false,
  serumMutationActive: false,
  error: false,
  errorMsg: "",
};

const dataReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CHECK_DATA_REQUEST":
      return {
        ...state,
        loading: true,
        error: false,
        errorMsg: "",
      };
    case "CHECK_DATA_SUCCESS":
      return {
        ...state,
        loading: false,
        name: action.payload.name,
        totalSupply: action.payload.totalSupply,
        apesMinted: action.payload.apesMinted,
        remainingSaleTime: action.payload.remainingSaleTime,
        currentPrice: action.payload.currentPrice,
        wlPrice: action.payload.wlPrice,
        saleFreeWhitelistActive: action.payload.saleFreeWhitelistActive,
        saleWhitelistActive: action.payload.saleWhitelistActive,
        publicSaleActive: action.payload.publicSaleActive,
        serumMutationActive: action.payload.serumMutationActive,
        error: false,
        errorMsg: "",
      };
    case "CHECK_DATA_FAILED":
      return {
        ...initialState,
        loading: false,
        error: true,
        errorMsg: action.payload,
      };
    case "CONNECTION_FAILED":
      return {
        ...initialState,
        loading: false,
        error: true,
        errorMsg: action.payload,
      };
    default:
      return state;
  }
};

export default dataReducer;
