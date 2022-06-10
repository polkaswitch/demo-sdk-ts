import { TokenType } from "./Token";

export type ChainType = {
  chainId: number;
  name?: string;
  slug?: string;
  tokens?: TokenType[];
}

type Chain = {
  data?: ChainType[];
  onChange?: (e: any) => void;
};

const ChainContainer: React.FC<Chain> = ({ data = [], onChange = () => {} }) => {
  const renderChains = () => data.map((chain, idx) => <option key={idx} value={chain.chainId}>{chain.name}</option>);

  return (
    <select className="border rounded-xl p-2" onChange={onChange}>
      {renderChains()}
    </select>
  );
};

export default ChainContainer;