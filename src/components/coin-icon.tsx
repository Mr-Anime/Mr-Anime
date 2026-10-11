import Image from "next/image";
import { cn } from "cn";

/** Mr.Coin currency icon (brand image from /icons/mr_coin.jpg). */
export function CoinIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/icons/mr_coin.jpg"
      alt="Mr.Coin"
      width={24}
      height={24}
      className={cn("size-4 shrink-0 rounded-full object-cover", className)}
    />
  );
}
