import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Transfer as TransferEvent, LiquidityAdded as LiquidityAddedEvent, LiquidityRemoved as LiquidityRemovedEvent, RangeLP } from "../generated/RangeLp-swETH-mswETH/RangeLP"
import { mlrtLiquidityStatus } from "../generated/schema"
import { BIGINT_ZERO, ETHER_ONE } from "./constants"

function isSwapAddress(address: Address): boolean {
    return (
        address.equals(Address.fromHexString("0x350d6d813be7b64681f91f16a98ef360bd42b66b")) || // wstETH/mstETH
        address.equals(Address.fromHexString("0x6177811663a60ac211566be5873c5ed441d9e948"))    // swETH/mswETH
    );
}

function updateLiquidity(contractAddress: Address, blockTimestamp: BigInt): void {
    let RangeLp = RangeLP.bind(contractAddress)
    let status = mlrtLiquidityStatus.load("RangeLP-" + contractAddress.toHexString())

    if (!status) {
        status = new mlrtLiquidityStatus("RangeLP-" + contractAddress.toHexString())
    }

    let storedBalance = RangeLp.getUnderlyingBalances()
    status.token0Balance = storedBalance.getAmount0Current()
    status.token1Balance = storedBalance.getAmount1Current()
    status.totalSupply = RangeLp.totalSupply()
    status.mlrtPerShare = status.token0Balance.times(ETHER_ONE).div(status.totalSupply)
    status.updateTimestamp = blockTimestamp
    status.save()
}

export function handleTransfer(event: TransferEvent): void {
    if (isSwapAddress(event.params.from) || isSwapAddress(event.params.to)) {
        updateLiquidity(event.address, event.block.timestamp)
    }
}

export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
    updateLiquidity(event.address, event.block.timestamp)
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
    updateLiquidity(event.address, event.block.timestamp)
}
