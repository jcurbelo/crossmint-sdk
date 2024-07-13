import React, { useState } from "react";

import { EVMAAWallet } from "@crossmint/client-sdk-aa";

import styles from "../styles/index.module.css";

interface GetNFTsComponentProps {
    aaWallet: EVMAAWallet | undefined;
}

function GetNFTsComponent({ aaWallet }: GetNFTsComponentProps) {
    const [walletContent, setWalletContent] = useState<any>();

    const getNFTs = async () => {
        if (aaWallet) {
            console.log("Getting NFTs");
            const walletContent = await aaWallet.getNFTs();
            console.log("NFTs", walletContent);
            setWalletContent(walletContent);
        } else {
            console.log("AAWallet not defined");
        }
    };

    return (
        <div className={styles.container}>
            <section className={styles.section}>
                <h2 className={styles.title}>NFTs</h2>
                <button className={styles.button} onClick={getNFTs} data-testid="getNFTsbtn">
                    Get NFTs
                </button>
                <textarea
                    className={styles.input}
                    value={JSON.stringify(walletContent)}
                    data-testid="getNFTsContent"
                    readOnly
                />
            </section>
        </div>
    );
}

export default GetNFTsComponent;
