"use client";

import { Fireworks } from "@/components/fireworks";
import { MintNFTButton } from "@/components/mint-nft-button";
import { PoweredByCrossmint } from "@/components/powered-by-crossmint";
import { SignInAuthButton } from "@/components/signin-auth-button";
import { Typography } from "@/components/typography";
import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@crossmint/client-sdk-react-ui";

export default function Home() {
    const { jwt, wallet } = useAuth();
    const [nftSuccessfullyMinted, setNftSuccessfullyMinted] = useState(false);

    const showMintButton = jwt != null && wallet != null;

    return (
        <div className="flex h-full w-full items-center md:p-4 justify-center">
            <div className="flex flex-col pb-12 items-center max-w-[538px] p-4">
                <div className="flex flex-col gap-2 text-center pb-8">
                    <Typography
                        style={{
                            background: "linear-gradient(to right, #602C1B, #FCB69F)",
                            WebkitBackgroundClip: "text",
                            color: "transparent",
                        }}
                        variant={"h1"}
                    >
                        Smart Wallet Demo
                    </Typography>
                    <Typography className="text-primary-foreground text-center">
                        Create a wallet on the fly and mint an NFT, just using face or touch ID. No passphrase,
                        transaction prompts or gas fees required.
                    </Typography>
                </div>

                <div className="flex flex-col w-full md:max-w-[340px] gap-10">
                    <div className="bg-card flex flex-col p-5 rounded-3xl shadow-dropdown">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="rounded-xl rounded-bl-none rounded-br-none" src={"/emoji-nft.png"} alt="nft" />
                        <div className="py-4">
                            <Typography className="text-secondary-foreground" variant="h3">
                                Smart Wallets Pioneer
                            </Typography>
                            <Typography className="text-muted-foreground" variant="h5">
                                by Logoipsum
                            </Typography>
                        </div>
                    </div>
                    <Fireworks play={nftSuccessfullyMinted} />

                    {showMintButton && nftSuccessfullyMinted ? (
                        <div className="flex gap-2 items-center self-center min-h-[52px]">
                            <Link
                                href="/wallet"
                                className="underline text-secondary-foreground text-lg font-semibold underline-offset-4"
                            >
                                Open in my wallet
                            </Link>
                        </div>
                    ) : null}
                    {showMintButton && !nftSuccessfullyMinted ? (
                        <MintNFTButton setNftSuccessfullyMinted={setNftSuccessfullyMinted} />
                    ) : null}
                    {!showMintButton && !nftSuccessfullyMinted ? <SignInAuthButton /> : null}

                    <PoweredByCrossmint />
                </div>
            </div>
        </div>
    );
}
