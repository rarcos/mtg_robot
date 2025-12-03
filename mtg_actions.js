const URL_MTGMINTCARD = "https://www.mtgmintcard.com/shopping-cart";
const URL_CARDKINGDOM = "https://www.cardkingdom.com/cart";

chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'mtg_export':
            (async () => {
                let [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
                var action;
                switch(tab.url) {
                    case URL_MTGMINTCARD:
                        action = 'add_all_cards_mint';
                        break;
                    case URL_CARDKINGDOM:
                        action = 'add_all_cards_ck';
                        break;
                    default:
                        throw new Error("Unknown Site");
                }
                let cardsResponse = await chrome.tabs.sendMessage(tab.id, {action: action});
                chrome.tabs.sendMessage(tab.id, {action: 'export_cards_xlsx', data: cardsResponse.cards});
            })();
            break;
    }
});

chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create(
        {
            id: 'mtg_export',
            title: 'Export Cart', 
            contexts: ['page'],
            documentUrlPatterns: [URL_MTGMINTCARD, URL_CARDKINGDOM]
        },
        () => void chrome.runtime.lastError,
    );
});

