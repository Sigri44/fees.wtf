const chainConfig = {
    '0x1': {id: '0x1', shortname: 'Ethereum', name:'Ethereum', symbol: 'eth', coingecko_name: 'ethereum', token: 'Ξ', color: '#03a9f4', explorer_uri: 'https://api.etherscan.io', key: 'KKEHS5KMBY8KJSTBKUXRT9X33NZUNDPSHD'},
    '0x38': {id: '0x38', shortname: 'BSC', name:'Binance Smart Chain', symbol: 'bnb', coingecko_name: 'binancecoin', token: 'Ḇ', color: "#f4ce03", explorer_uri: 'https://api.bscscan.com', key: 'UWB7YUCVQXT7TGFK41TNJSJBIHDQ1JGU9D'},
    '0x64': {id: '0x64', shortname: 'Gnosis', name:'xDai', symbol: 'xdai', coingecko_name: 'xdai', token: 'Ẍ', color: '#48a9a6', explorer_uri: 'https://api.gnosisscan.io', key: '44V4CPWIAJFHCUAX5FWNM1WBAHSYNQ3VEW'},
    '0x89': {id: '0x89', shortname: 'Polygon', name:'Polygon', symbol: 'matic', coingecko_name: 'matic-network', token: 'M̃', color: '#9d03f4', explorer_uri: 'https://api.polygonscan.com', key: 'QDPWKASEUSSYTKX9ZVMSSQGX4PTCZGHNC8'},
    '0xfa': {id: '0xfa', shortname: 'Fantom', name:'Fantom', symbol: 'ftm', coingecko_name: 'fantom', token: 'ƒ', color: '#00dbff', explorer_uri: 'https://api.ftmscan.com', key: 'B5UU3GDR3VJYVXFYT6RPK5RA6I8J5CV6B3'},
    '0xa4b1': {id: '0xa4b1', shortname: 'Arbitrum', name:'Arbitrum', symbol: 'eth', coingecko_name: 'ethereum', token: 'Ξ', color: '#00dbff', explorer_uri: 'https://api.arbiscan.io', key: 'PF6G4IA13FBIB6593128DSZP4PCSMC72EC'},
    '0xa': {id: '0xa', shortname: 'Optimism', name:'Optimism', symbol: 'eth', coingecko_name: 'ethereum', token: 'Ξ', color: '#00dbff', explorer_uri: 'https://api-optimistic.etherscan.io', key: '4MVDPEMUS8XYVTQ7758XRR5VNY7J5V8K76'}
};

function multiply(x, y) {
    var prod = [];
    var i;
    for (i=0; i < x.length; i++) {
        prod[i] = x[i] * y[i];
    }

    return prod;
}

function formatter(num) {
    return num > 999999 ? (num/1e6).toFixed(3) + ' million' : num;
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });

    return vars;
}

function comma(x) {
    var parts = x.toString().split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    x = parts.join(".")
    return formattedNumber = parseFloat(x).toFixed(4).replace(/[.,]0000$/, "")
}

async function getCoingeckoPrice() {
    let coingeckoSymbols = []
    for (const chainId in chainConfig) {
        coingeckoSymbols.push(chainConfig[chainId].coingecko_name)
    }

    // Remove duplicates entry into coingeckoSymbols
    coingeckoSymbols = coingeckoSymbols.filter((value, index) => coingeckoSymbols.indexOf(value) === index)

    uri = 'https://api.coingecko.com/api/v3/simple/price?ids='+coingeckoSymbols.join(", ")+'&vs_currencies=usd'
    const coingeckoPrices = await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+coingeckoSymbols.join(",").trim()+'&vs_currencies=usd')
        .then(response => {return response.json()})
        .catch(err => {
            console.log('(â•¯Â°â–¡Â°)â•¯ï¸µ â”»â”â”»', err);
        })
    
    return coingeckoPrices
}

async function displayResultsInTable(chainConfigId, result) {
    const tableBody = document.getElementById('resultTableBody');
    const config = chainConfig[chainConfigId];

    const newRow = document.createElement('tr');
    // newRow.innerHTML = `
    //     <td><span id="${config.shortname}">${config.shortname}</span></td>
    //     <td>${config.symbol}</td>
    //     <td>${config.token}${comma(formatter(result.gasFeeTotal / 1e18))}</td>
    //     <td>${comma(result.nOut)}</td>
    //     <td>${(result.gasPriceTotal / result.nOut / 1e9).toFixed(2)}</td>
    //     <td>$ ${result.totalCost}</td>
    // `;
    newRow.innerHTML = `
        <td><span id="${config.shortname}">${config.shortname}</span></td>
        <td>${config.symbol}</td>
        <td>${config.token}${comma(formatter(result.gasFeeTotal / 1e18))}</td>
        <td>${(result.gasPriceTotal / result.nOut / 1e9).toFixed(2)}</td>
        <td>$ ${result.totalCost}</td>
    `;

    tableBody.appendChild(newRow);
}

async function getTxs(address, chain, coingeckoPrices) {
    totalCost = 0;
    tokenusd = coingeckoPrices[chain.coingecko_name].usd;
    console.log(chain.symbol.toUpperCase()+'USD: $' + tokenusd)
    
    let key = chain.key
    let u = chain.explorer_uri+`/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc`
    if (chain.key) { u += `&apikey=${key}` }
    let response = await fetch(u)

    if (response.ok) { // if HTTP-status is 200-299
        var json = await response.json();
    } else {
        console.error("HTTP-Error: " + response.status);
    }

    let txs = json['result']
    let n = txs.length
    let from, txs2

    while (n===10000) {
        from = txs[txs.length - 1].blockNumber
        u = chain.explorer_uri+`/api?module=account&action=txlist&address=${address}&startblock=${from}&endblock=99999999&sort=asc&apikey=${key}`
        response = await fetch(u)

        if (response.ok) { // if HTTP-status is 200-299
            json = await response.json();
        } else {
            console.log('Â¯\_(ãƒ„)_/Â¯ : ' + response.status);
            break
        }

        txs2 = json['result']
        n = txs2.length
        txs.push.apply(txs, txs2)
    }

    let txsOut = $.grep(txs, function(v) {
        return v.from === address.toLowerCase();
    });

    txsOut = txsOut.map(({ confirmations, ...item }) => item);
    txsOut = new Set(txsOut.map(JSON.stringify));
    txsOut = Array.from(txsOut).map(JSON.parse);
    // remove duplicates
    //localStorage.setItem('txsOut', JSON.stringify(txsOut));
    // console.log('All outgoing txs:', txsOut)
    
    var nOut = txsOut.length;
    // $('#nOut').text(comma(nOut));
    // var txsOutFail = $.grep(txsOut, function(v) {
    //     return v.isError === '1';
    // });
    // var nOutFail = txsOutFail.length;
    // $('#nOutFail').text(comma(nOutFail));
    // console.log('Failed outgoing txs:', txsOutFail);
    
    if (nOut > 0) {
        var gasUsed = txsOut.map(value => parseInt(value.gasUsed));
        // var gasUsedTotal = gasUsed.reduce((partial_sum, a) => partial_sum + a,0); 
        var gasPrice = txsOut.map(value => parseInt(value.gasPrice));
        // var gasPriceMin = Math.min(...gasPrice);
        // var gasPriceMax = Math.max(...gasPrice);
        var gasFee = multiply(gasPrice, gasUsed);
        var gasFeeTotal = gasFee.reduce((partial_sum, a) => partial_sum + a,0); 
        var gasPriceTotal = gasPrice.reduce((partial_sum, a) => partial_sum + a,0);
        // var gasUsedFail = txsOutFail.map(value => parseInt(value.gasUsed));
        // var gasPriceFail = txsOutFail.map(value => parseInt(value.gasPrice));
        // var gasFeeFail = multiply(gasPriceFail, gasUsedFail);
        // var gasFeeTotalFail = gasFeeFail.reduce((partial_sum, a) => partial_sum + a,0);

        // $('#gasUsedTotal').text(comma(formatter(gasUsedTotal)));
        // $('#gasPricePerTx').text(comma((gasPriceTotal / nOut / 1e9).toFixed(1)));
        // $('#gasPricePerTx').hover(function() {
        //     $(this).css('cursor', 'help').attr('title', 'Min: ' + (gasPriceMin / 1e9).toFixed(3) + '; Max: ' + (gasPriceMax / 1e9).toFixed(3));
        //     Tipped.create('#gasPricePerTx', 'Min: ' + (gasPriceMin / 1e9).toFixed(1) + '; Max: ' + (gasPriceMax / 1e9).toFixed(1), { offset: { y: 20 } });
        // }, function() {
        //     $(this).css('cursor', 'auto');
        // });
        // $('#gasFeeTotal').text(chain.token + comma((gasFeeTotal / 1e18).toFixed(3)));

        if (tokenusd !== null) {
            totalCost = (tokenusd * gasFeeTotal / 1e18).toFixed(2);
        }
    } else {
        gasFeeTotal = 0;
    }

    // console.log('color::', chain.color)
    // console.log('jQ_before::', $('body span').css('color'))

    // $('body span').css('color', chain.color)
    // $(`#${chain.shortname}`).css('color', chain.color);

    // console.log('jQ_after::', $('body span').css('color'))

    return {gasFeeTotal, nOut, gasPriceTotal, totalCost}
}

async function main(address) {
    let coingeckoPrices = []
    let totalCostAccount = 0
    coingeckoPrices = await getCoingeckoPrice()
    for (const chainId in chainConfig) {
        // console.log('chain:', chainConfig[chainId])
        let result = await getTxs(address, chainConfig[chainId], coingeckoPrices)
        totalCostAccount += parseFloat(result.totalCost)
        // console.log('result:', result)
        displayResultsInTable(chainId, result)
        // break
    }
    $('<p>Total cost <span id="oofCost">$ ' + totalCostAccount.toFixed(2) + '</span>.</p>').insertBefore($('#tipsy'))
}

async function tip(amount) {
    if(window.hasOwnProperty("ethereum") && window.ethereum.hasOwnProperty("isMetaMask")) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const tx = signer.sendTransaction({
            to: '0x5237f30BB101F36deD9fc77a1753878958Cfdf9a',
            value: ethers.utils.parseEther(amount)
        })
    } else {
        return alert('Install MetaMask to use this cool feature. https://metamask.io')
    }
}

$(document).on('click', '#tinytip', function (e) {
    tip("0.001");
    e.preventDefault();
});

$(document).on('click', '#smalltip', function (e) {
    tip("0.01");
    e.preventDefault();
});

$(document).on('click', '#bigtip', function (e) {
    tip("0.1");
    e.preventDefault();
});

$(document).on('click', '#hugetip', function (e) {
    tip("1");
    e.preventDefault();
});
