import  { useEffect, useState } from "react";
import ChainContainer, { ChainType } from "./components/Chain";
import InputContainer from "./components/Input";
import TokenContainer, { TokenType } from "./components/Token";
import useAuth from "./hooks/useAuth";
import SwingSDK, { TransferParams } from "@swing.xyz/sdk";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";

declare var window: any;

const sdk = new SwingSDK();

const Home = () => {
  const { account, chainId, connect } = useAuth();
  const [chains, setChains] = useState<ChainType[]>([]);
  const [fromChain, setFromChain] = useState<ChainType>();
  const [toChain, setToChain] = useState<ChainType>();
  const [fromToken, setFromToken] = useState<TokenType>();
  const [toToken, setToToken] = useState<TokenType>();
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    sdk.init().then(() => {
      setChains(sdk.chains);
      setFromChain(sdk.chains[0]);
      setToChain(sdk.chains[0]);
    });
  }, []);

  useEffect(() => {
    if (fromChain) setFromToken(fromChain.tokens && fromChain.tokens[0]);
  }, [fromChain]);

  useEffect(() => {
    if (toChain) setToToken(toChain.tokens && toChain.tokens[0]);
  }, [toChain]);

  const onChangeFromChain = (e: any) => {
    const chain = chains.find((c) => Number(c.chainId) === Number(e.target.value));
    setFromChain(chain);
  };
  const onChangeToChain = (e: any) => {
    const chain = chains.find((c) => Number(c.chainId) === Number(e.target.value));
    setToChain(chain);
  };
  const onChangeFromToken = (e: any) => {
    const token = fromChain?.tokens?.find((t) => t.address === e.target.value);
    setFromToken(token);
  };
  const onChangeToToken = (e: any) => {
    const token = toChain?.tokens?.find((t) => t.address === e.target.value);
    setToToken(token);
  };

  const getButtonName = () => {
    if (!account) return 'Connect Wallet';
    if (Number(fromChain?.chainId) !== Number(chainId)) return `Switch to ${fromChain?.name || 'Ethereum'}`;
    return 'Send';
  };

  const onChangeAmount = (e: any) => {
    setAmount(Number(e.target.value));
  };

  const onClick = async () => {
    if (!account) {
      console.log('Please connect to account');
      return connect();
    }

    if (!fromChain || !toChain || !fromToken || !toToken || !amount) {
      console.log('Please check chain and tokens');
      return;
    }

    if (Number(fromChain?.chainId) !== Number(chainId)) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${fromChain.chainId.toString(16)}` }],
        });
      } catch(e) {
        console.log('Error switching chain:', e);
        // await window.ethereum.request({
        //   method: 'wallet_addEthereumChain',
        //   params: [fromChain],
        // });
      }
      return;
    }

    const tokenAmount = new BigNumber(amount).times(10 ** (fromToken.decimal || 0));

    const transferParams: TransferParams = {
      fromChain: fromChain.slug as any,
      toChain: toChain.slug as any,
    
      fromToken: fromToken.symbol as any,
      toToken: toToken.symbol as any,
    
      amount: tokenAmount.toString(),
    
      fromUserAddress: account,
      toUserAddress: account,
    };

    if (window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      sdk.wallet.connect(provider);
    } else {
      alert("Provider is not available");
      return;
    }
    
    console.log('Getting quote...');
    const quote = await sdk.getQuote(transferParams);

    console.log('Quote:', quote);
    const transferRoute = quote.routes[0].route;

    console.log('Sending transfer...', transferRoute);
    await sdk.transfer(transferRoute, transferParams);
  };

  return (
    <div className="w-128 mx-auto mt-40">
      <h1 className="text-2xl font-bold text-white">
        CROSS-CHAIN TRANSFER (DEMO SDK)
      </h1>
      <div className="mt-4 p-8 rounded-xl border border-slate-300 bg-white">
        <div className="flex flex-row gap-4">
          <div className="w-1/2 flex flex-col gap-4">
            <p>From</p>
            <ChainContainer data={chains} onChange={onChangeFromChain} />
            <TokenContainer data={fromChain?.tokens} onChange={onChangeFromToken} />
          </div>
          <div className="w-1/2 flex flex-col gap-4">
            <p>To</p>
            <ChainContainer data={chains} onChange={onChangeToChain} />
            <TokenContainer data={toChain?.tokens} onChange={onChangeToToken} />
          </div>
        </div>

        <div className="mt-4 flex flex-row gap-4">
          <div className="w-1/2 flex flex-col gap-4 justify-center">
            <p>Amount <span className="p-2 font-bold bg-stone-400 rounded-xl text-white cursor-pointer">Max</span></p>
          </div>
          <div className="w-1/2 flex flex-col gap-4">
            <InputContainer onChange={onChangeAmount} />
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button
            className="w-full bg-blue-400 px-6 py-4 rounded text-white hover:bg-blue-500 active:bg-blue-600"
            onClick={onClick}
          >
            {getButtonName()}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
