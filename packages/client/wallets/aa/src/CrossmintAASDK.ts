import { CrossmintWalletService } from "@/api";
import { EVMAAWallet, TChain, entryPoint, getBundlerRPC } from "@/blockchain";
import type { BackwardsCompatibleChains, CrossmintAASDKInitParams, WalletConfig } from "@/types";
import {
    CURRENT_VERSION,
    SCW_SERVICE,
    WalletSdkError,
    ZERO_DEV_TYPE,
    createOwnerSigner,
    errorToJSON,
    transformBackwardsCompatibleChains,
} from "@/utils";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import type { KernelValidator } from "@zerodev/ecdsa-validator";
import { KernelSmartAccount, createKernelAccount } from "@zerodev/sdk";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { EntryPoint } from "permissionless/types/entrypoint";
import { HttpTransport, PublicClient, createPublicClient, http } from "viem";

import {
    BlockchainIncludingTestnet,
    UserIdentifierParams,
    blockchainToChainId,
    isEVMBlockchain,
    validateAPIKey,
} from "@crossmint/common-sdk-base";

import { logError, logInfo } from "./services/logging";
import { parseUserIdentifier } from "./utils/user";

export class CrossmintAASDK {
    crossmintService: CrossmintWalletService;
    private readonly projectId: string;

    private constructor(config: CrossmintAASDKInitParams) {
        const validationResult = validateAPIKey(config.apiKey);
        if (!validationResult.isValid) {
            throw new Error("API key invalid");
        }

        this.projectId = validationResult.projectId;
        this.crossmintService = new CrossmintWalletService(config.apiKey);
    }

    static init(params: CrossmintAASDKInitParams): CrossmintAASDK {
        return new CrossmintAASDK(params);
    }

    async getOrCreateWallet<B extends BlockchainIncludingTestnet = BlockchainIncludingTestnet>(
        user: UserIdentifierParams,
        chain: B | BackwardsCompatibleChains,
        walletConfig: WalletConfig
    ) {
        try {
            chain = transformBackwardsCompatibleChains(chain);
            logInfo("[GET_OR_CREATE_WALLET] - INIT", {
                service: SCW_SERVICE,
                user,
                chain,
            });

            if (!isEVMBlockchain(chain)) {
                throw new WalletSdkError(`The blockchain ${chain} is not supported`);
            }

            const userIdentifier = parseUserIdentifier(user);

            const owner = await createOwnerSigner({
                chain,
                walletConfig,
            });

            const address = owner.address;

            const publicClient = createPublicClient({
                transport: http(getBundlerRPC(chain)),
            });

            const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
                signer: owner,
                entryPoint: ENTRYPOINT_ADDRESS_V07,
            });

            const account = await createKernelAccount(publicClient, {
                plugins: {
                    sudo: ecdsaValidator,
                },
                index: BigInt(0),
                entryPoint: ENTRYPOINT_ADDRESS_V07,
            });

            const evmAAWallet = new EVMAAWallet(
                account as unknown as KernelSmartAccount<EntryPoint, HttpTransport, TChain>,
                this.crossmintService,
                chain,
                publicClient as PublicClient,
                ecdsaValidator as unknown as KernelValidator<entryPoint, "ECDSAValidator">
            );

            const abstractAddress = account.address;
            const { sessionKeySignerAddress } = await this.crossmintService.createSessionKey(abstractAddress);

            evmAAWallet.setSessionKeySignerAddress(sessionKeySignerAddress);

            await this.crossmintService.storeAbstractWallet({
                userIdentifier,
                type: ZERO_DEV_TYPE,
                smartContractWalletAddress: abstractAddress,
                eoaAddress: address,
                sessionKeySignerAddress,
                version: CURRENT_VERSION,
                baseLayer: "evm",
                chainId: blockchainToChainId(chain),
            });
            logInfo("[GET_OR_CREATE_WALLET] - FINISH", {
                service: SCW_SERVICE,
                userEmail: user.email!,
                chain,
                abstractAddress,
            });
            return evmAAWallet;
        } catch (error: any) {
            logError("[GET_OR_CREATE_WALLET] - ERROR_CREATING_WALLET", {
                service: SCW_SERVICE,
                error: errorToJSON(error),
                user,
                chain,
            });

            throw new WalletSdkError(`Error creating the Wallet [${error?.name ?? ""}]`);
        }
    }

    /**
     * Clears all key material and state from device storage, related to all wallets stored. Call this method when the user signs out of your app, if you don't have a user identifier.
     */
    async purgeAllWalletData(): Promise<void> {
        //Removes the Fireblocks NCW data stored on the localstorage
        const keys = Object.keys(localStorage);
        const keysToDelete = keys.filter((key) => key.startsWith("NCW-"));
        keysToDelete.forEach((key) => {
            localStorage.removeItem(key);
        });
    }
}
