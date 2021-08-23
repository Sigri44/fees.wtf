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
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return parts.join(".");
}

async function getTxs(address) {
    const chainConfig = []

    chainConfig['0x1'] = {id: '0x1', shortname: 'eth', name:'Ethereum', symbol: 'eth', coingecko_name: 'ethereum', token: 'Ξ', color: '#03a9f4', explorer_uri: 'https://api.etherscan.io', key: 'KKEHS5KMBY8KJSTBKUXRT9X33NZUNDPSHD'}
    chainConfig['0x38'] = {id: '0x38', shortname: 'bsc', name:'Binance Smart Chain', symbol: 'bnb', coingecko_name: 'binancecoin', token: 'Ḇ', color: "#f4ce03", explorer_uri: 'https://api.bscscan.com', key: 'UWB7YUCVQXT7TGFK41TNJSJBIHDQ1JGU9D'}
    chainConfig['0x64'] = {id: '0x64', shortname: 'xdai', name:'xDai', symbol: 'xdai', coingecko_name: 'xdai', token: 'Ẍ', color: '#48a9a6', explorer_uri: 'https://blockscout.com/xdai/mainnet', key: ''}
    chainConfig['0x89'] = {id: '0x89', shortname: 'matic', name:'Polygon', symbol: 'matic', coingecko_name: 'matic-network', token: 'M̃', color: '#9d03f4', explorer_uri: 'https://api.polygonscan.com', key: 'QDPWKASEUSSYTKX9ZVMSSQGX4PTCZGHNC8'}
    chainConfig['0xfa'] = {id: '0xfa', shortname: 'ftm', name:'Fantom', symbol: 'ftm', coingecko_name: 'fantom', token: 'ƒ', color: '#00dbff', explorer_uri: 'https://api.ftmscan.com', key: 'B5UU3GDR3VJYVXFYT6RPK5RA6I8J5CV6B3'}
        // {id: '0xa86a', shortname: 'avax', name:'Avalanche', symbol: 'avax', coingecko_name: 'avalanche-2', token: 'Ã', color: '#ec1616', explorer_uri: 'https://cchain.explorer.avax.network/', key: ''},

    // Detect chainId
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    if (!chainId in chainConfig) {
        let authorizedNetworks = "";
        for (const [key, network] of Object.entries(chainConfig)) {
            authorizedNetworks += network.name + ", ";
        }
        authorizedNetworks += '[...]'

        console.log('ChainId ' + chainId + ' is not supported. Select a valid network (Like ' + authorizedNetworks + ').')
        $('body').html('<p id="oops">Please select a valid network (Like <strong>' + authorizedNetworks + '</strong>).</p>')
        return;
    }

    let coingeckoSymbol = chainConfig[chainId].coingecko_name
    let tokenusd = await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+coingeckoSymbol+'&vs_currencies=usd')
        .then(response => {return response.json()})
        .catch(err => {
            console.log('(â•¯Â°â–¡Â°)â•¯ï¸µ â”»â”â”»', err);
        })

        tokenusd = tokenusd[coingeckoSymbol].usd;
    console.log(chainConfig[chainId].symbol.toUpperCase()+'USD: $' + tokenusd);
    
    let key = chainConfig[chainId].key
    let u = chainConfig[chainId].explorer_uri+`/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc`
    if (chainConfig[chainId].key) { u += `&apikey=${key}` }
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
        u = chainConfig[chainId].explorer_uri+`/api?module=account&action=txlist&address=${address}&startblock=${from}&endblock=99999999&sort=asc&apikey=${key}`
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
    console.log('All outgoing txs:', txsOut)
    
    var nOut = txsOut.length;
    $('#nOut').text(comma(nOut));
    var txsOutFail = $.grep(txsOut, function(v) {
        return v.isError === '1';
    });
    var nOutFail = txsOutFail.length;
    $('#nOutFail').text(comma(nOutFail));
    console.log('Failed outgoing txs:', txsOutFail);
    
    if (nOut > 0) {
        var gasUsed = txsOut.map(value => parseInt(value.gasUsed));
        var gasUsedTotal = gasUsed.reduce((partial_sum, a) => partial_sum + a,0); 
        var gasPrice = txsOut.map(value => parseInt(value.gasPrice));
        var gasPriceMin = Math.min(...gasPrice);
        var gasPriceMax = Math.max(...gasPrice);
        var gasFee = multiply(gasPrice, gasUsed);
        var gasFeeTotal = gasFee.reduce((partial_sum, a) => partial_sum + a,0); 
        var gasPriceTotal = gasPrice.reduce((partial_sum, a) => partial_sum + a,0);
        var gasUsedFail = txsOutFail.map(value => parseInt(value.gasUsed));
        var gasPriceFail = txsOutFail.map(value => parseInt(value.gasPrice));
        var gasFeeFail = multiply(gasPriceFail, gasUsedFail);
        var gasFeeTotalFail = gasFeeFail.reduce((partial_sum, a) => partial_sum + a,0);

        $('#gasUsedTotal').text(comma(formatter(gasUsedTotal)));
        $('#gasPricePerTx').text(comma((gasPriceTotal / nOut / 1e9).toFixed(1)));
        $('#gasPricePerTx').hover(function() {
            $(this).css('cursor', 'help').attr('title', 'Min: ' + (gasPriceMin / 1e9).toFixed(3) + '; Max: ' + (gasPriceMax / 1e9).toFixed(3));
            Tipped.create('#gasPricePerTx', 'Min: ' + (gasPriceMin / 1e9).toFixed(1) + '; Max: ' + (gasPriceMax / 1e9).toFixed(1), { offset: { y: 20 } });
        }, function() {
            $(this).css('cursor', 'auto');
        });
        $('#gasFeeTotal').text(chainConfig[chainId].token + comma((gasFeeTotal / 1e18).toFixed(3)));
        
        if (nOutFail > 0) {
            $('#gasFeeTotalFail').html(chainConfig[chainId].token + (gasFeeTotalFail / 1e18).toFixed(3));
            var oof = Math.max(...gasFeeFail)/1e18;

            if (oof > 0.1) {
                var i = gasFeeFail.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
                var tx = txsOutFail[i];
                $('<p><a id="oof" href="https://bscscan.com/tx/' + 
                tx.hash + '">This one</a> cost <span id="oofCost">' + chainConfig[chainId].token +
                (gasFeeFail[i]/1e18).toFixed(3) + '</span>.</p>').insertBefore($('#tipsy'))
            }
        }  else {
            $('#gasFeeTotalFail').html('nothing');
        }

        if (tokenusd !== null) {
            $('#tokenusd').text('$' + comma(formatter((tokenusd * gasFeeTotal / 1e18).toFixed(2))));
            $('#oofCost').append(' ($' + comma(formatter((tokenusd * gasFeeFail[i] / 1e18).toFixed(2))) + ')');
        }
    } else {
        $('#gasUsedTotal').text(0);
        $('#gasFeeTotal').text(chainConfig[chainId].token + 0);
    }

    console.log('color::', chainConfig[chainId].color)
    console.log('jQ::', $('body span').css('color'))

    $('body span').css('color', chainConfig[chainId].color)

    console.log('jQ::', $('body span').css('color'))

}

function main(address) {
    console.log('Getting transactions for ' + address)
    getTxs(address);
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
