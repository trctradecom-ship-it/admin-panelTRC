let provider, signer, user, contract, token, chart;

const contractAddress = "0xc08983be707bf4b763e7A0f3cCAD3fd00af6620d";
const tokenAddress = "0xc08983be707bf4b763e7A0f3cCAD3fd00af6620d";

const abi = [
    "function owner() view returns(address)",
    "function withdrawLiquidityTokens()",
    "function balanceOf(address) view returns(uint256)"
];

const tokenABI = [
    "function approve(address,uint256) returns(bool)"
];

// ==================== HELPERS ====================
function updateStatus(text){
    document.getElementById("status").innerHTML = text;
}

async function updateBalance(){
    if(!contract) return;
    const bal = await contract.balanceOf(contractAddress);
    const formatted = ethers.utils.formatUnits(bal,18);
    document.getElementById("balance").innerText =
        "Contract Liquidity Balance: " + formatted + " TRC";

    updateChart(formatted);
}

// ==================== HANDLE TRANSACTION ====================
async function handleTx(tx){
    try{
        updateStatus("⏳ Transaction sent...");
        const sent = await tx;
        updateStatus(`
            Transaction submitted<br>
            <a href="https://polygonscan.com/tx/${sent.hash}" target="_blank">View on PolygonScan</a>
        `);
        await sent.wait();
        updateStatus(`
            ✅ Transaction Confirmed<br>
            <a href="https://polygonscan.com/tx/${sent.hash}" target="_blank">Open PolygonScan</a>
        `);
        await updateBalance();
    }catch(e){
        console.error(e);
        updateStatus("❌ Transaction failed or rejected");
    }
}

// ==================== CONNECT WALLET ====================
document.getElementById("connectBtn").onclick = async function connectWallet(){
    try{
        if(!window.ethereum){ alert("Install MetaMask!"); return; }

        await window.ethereum.request({method:'eth_requestAccounts'});
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        user = await signer.getAddress();

        document.getElementById("wallet").innerText = "Wallet: " + user.slice(0,6) + "..." + user.slice(-4);

        contract = new ethers.Contract(contractAddress, abi, signer);
        token = new ethers.Contract(tokenAddress, tokenABI, signer);

        const owner = await contract.owner();
        updateStatus((user.toLowerCase() === owner.toLowerCase()) ? "✅ Owner Connected" : "⚠️ Not Owner");

        await updateBalance();
    }catch(e){
        console.error(e);
        updateStatus("❌ " + (e.message || "Connection failed"));
    }
};

// ==================== WITHDRAW ====================
document.getElementById("withdrawBtn").onclick = async function(){
    if(!contract){ alert("Connect wallet first"); return; }
    handleTx(contract.withdrawLiquidityTokens());
};

// ==================== CHART ====================
function initChart(){
    const ctx = document.getElementById('liquidityChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Contract Liquidity TRC',
                data: [],
                borderColor: 'blue',
                backgroundColor: 'rgba(0,0,255,0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive:true,
            maintainAspectRatio:false,
            scales: { y: { beginAtZero:true } }
        }
    });
}

function updateChart(balance){
    if(!chart) return;
    const now = new Date().toLocaleTimeString();
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(balance);
    if(chart.data.labels.length > 20){
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update();
}

// Initialize chart after DOM loads
window.addEventListener('load', initChart);
