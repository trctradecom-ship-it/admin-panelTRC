let provider, signer, user, contract;
const contractAddress = "0xc08983be707bf4b763e7A0f3cCAD3fd00af6620d";
const abi = [
    "function owner() view returns(address)",
    "function withdrawLiquidityTokens()",
    "function balanceOf(address) view returns(uint256)"
];
 
// Update liquidity balance display
async function updateBalance() {
    if (!contract) return;
    try {
        const contractBal = await contract.balanceOf(contractAddress);
        document.getElementById("balance").innerText = 
            "Contract Liquidity Balance: " + ethers.utils.formatUnits(contractBal, 18) + " TRC";
    } catch(e) {
        console.log(e);
    }
}

// Connect Wallet
document.getElementById("connectBtn").onclick = async () => {
    try {
        if (!window.ethereum) { alert("Install MetaMask"); return; }
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        user = await signer.getAddress();
        document.getElementById("wallet").innerText = "Wallet: " + user.slice(0,6) + "..." + user.slice(-4);

        contract = new ethers.Contract(contractAddress, abi, signer);

        const owner = await contract.owner();
        document.getElementById("status").innerText = 
            (user.toLowerCase() === owner.toLowerCase()) ? "✅ Owner Connected" : "⚠️ Not Owner";

        await updateBalance();

    } catch(err) {
        console.error(err);
        document.getElementById("status").innerText = "❌ " + (err.message || "Connection failed");
    }
};

// Withdraw Liquidity Tokens
document.getElementById("withdrawBtn").onclick = async () => {
    try {
        if (!contract) { alert("Connect wallet first"); return; }
        document.getElementById("status").innerText = "Sending transaction...";
        const tx = await contract.withdrawLiquidityTokens();
        document.getElementById("status").innerHTML = 
            `⏳ Tx sent: <a href="https://polygonscan.com/tx/${tx.hash}" target="_blank">View on Polygonscan</a>`;
        await tx.wait();
        document.getElementById("status").innerText = "✅ Withdraw success!";
        await updateBalance();
    } catch(err) {
        console.error(err);
        document.getElementById("status").innerText = "❌ " + (err.reason || err.message);
    }
};
