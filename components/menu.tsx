import Link from "next/link";
import { SetStateAction } from "react";

export type MenuProps = {
  joinCode: string;
  setJoinCode: React.Dispatch<SetStateAction<string>>;
  setPage: React.Dispatch<SetStateAction<string>>;
};

export const Menu = ({ joinCode, setJoinCode, setPage }: MenuProps) => {
  return (
    <main>
      <div>
        <Link href="../createCall">
          <button>Make a Call</button>
        </Link>
      </div>
      <div>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Enter a code"
        />
      </div>
    </main>
  );
};
export default Menu;
