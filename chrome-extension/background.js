// // Background script - Makes API calls using stored cookies

// const BEARER_TOKEN = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

// // Get all cookies for Twitter/X
// async function getTwitterCookies() {
//   const xCookies = await chrome.cookies.getAll({ domain: '.x.com' });
//   const twitterCookies = await chrome.cookies.getAll({ domain: '.twitter.com' });
  
//   // Combine and deduplicate
//   const cookieMap = new Map();
//   [...xCookies, ...twitterCookies].forEach(c => {
//     cookieMap.set(c.name, c.value);
//   });
  
//   return cookieMap;
// }

// // Get specific cookie value
// async function getCookie(name) {
//   const cookies = await getTwitterCookies();
//   return cookies.get(name) || null;
// }

// // Build cookie header string
// async function buildCookieHeader() {
//   const cookies = await getTwitterCookies();
//   const parts = [];
//   cookies.forEach((value, name) => {
//     parts.push(`${name}=${value}`);
//   });
//   return parts.join('; ');
// }

// // Check if user is logged in
// async function isLoggedIn() {
//   const authToken = await getCookie('auth_token');
//   return !!authToken;
// }

// // Make authenticated request to Twitter API
// async function makeTwitterRequest(url, options = {}) {
//   const ct0 = await getCookie('ct0');
//   const cookieHeader = await buildCookieHeader();
  
//   if (!ct0) {
//     throw new Error('Not logged in to Twitter/X. Please log in at x.com first.');
//   }
  
//   const headers = {
//     'authorization': BEARER_TOKEN,
//     'x-csrf-token': ct0,
//     'x-twitter-auth-type': 'OAuth2Session',
//     'x-twitter-active-user': 'yes',
//     'x-twitter-client-language': 'en',
//     'accept': '*/*',
//     'accept-language': 'en-US,en;q=0.9',
//     'cookie': cookieHeader,
//     ...options.headers
//   };
  
//   console.log('Making request to:', url);
//   console.log('With ct0:', ct0.substring(0, 20) + '...');
//   console.log('Cookie header length:', cookieHeader.length);
  
//   const response = await fetch(url, {
//     ...options,
//     headers,
//     credentials: 'omit', // We're manually setting cookies
//   });
  
//   return response;
// }

// // Fetch user info
// async function getUserInfo() {
//   const loggedIn = await isLoggedIn();
//   if (!loggedIn) {
//     throw new Error('Please log in to Twitter/X first');
//   }
  
//   const queryId = 'oMJBTitpNh7CwzP8Y9Pazg';
//   const variables = {
//     withCommunitiesMemberships: false,
//     withSubscribedTab: false,
//     withCommunitiesCreation: false
//   };
//   const features = {
//     responsive_web_graphql_exclude_directive_enabled: true,
//     verified_phone_label_enabled: false,
//     responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
//     responsive_web_graphql_timeline_navigation_enabled: true
//   };
  
//   // Try x.com first, then twitter.com
//   const bases = ['https://x.com/i/api/graphql', 'https://twitter.com/i/api/graphql'];
  
//   for (const base of bases) {
//     const url = `${base}/${queryId}/Viewer?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(features))}`;
    
//     try {
//       const response = await makeTwitterRequest(url, { method: 'GET' });
      
//       console.log('Response status:', response.status);
      
//       if (response.ok) {
//         const data = await response.json();
        
//         if (data.data?.viewer?.user_results?.result) {
//           const user = data.data.viewer.user_results.result.legacy;
//           const userCore = data.data.viewer.user_results.result;
          
//           return {
//             id: userCore.rest_id,
//             name: user.name,
//             screenName: user.screen_name,
//             profileImageUrl: user.profile_image_url_https?.replace('_normal', '_bigger') || user.profile_image_url_https
//           };
//         }
//       } else {
//         const text = await response.text();
//         console.error(`Failed with ${base}:`, response.status, text.substring(0, 200));
//       }
//     } catch (error) {
//       console.error(`Error with ${base}:`, error);
//     }
//   }
  
//   throw new Error('Failed to fetch user info. Please make sure you are logged in to x.com');
// }

// // Post a tweet
// async function postTweet(text) {
//   const loggedIn = await isLoggedIn();
//   if (!loggedIn) {
//     throw new Error('Please log in to Twitter/X first');
//   }
  
//   const queryId = 'tTsjMKyhajZvK4q76mpIBg';
  
//   const variables = {
//     tweet_text: text,
//     dark_request: false,
//     media: {
//       media_entities: [],
//       possibly_sensitive: false
//     },
//     semantic_annotation_ids: []
//   };
  
//   const features = {
//     communities_web_enable_tweet_community_results_fetch: true,
//     c9s_tweet_anatomy_moderator_badge_enabled: true,
//     tweetypie_unmention_optimization_enabled: true,
//     responsive_web_edit_tweet_api_enabled: true,
//     graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
//     view_counts_everywhere_api_enabled: true,
//     longform_notetweets_consumption_enabled: true,
//     responsive_web_twitter_article_tweet_consumption_enabled: true,
//     tweet_awards_web_tipping_enabled: false,
//     creator_subscriptions_quote_tweet_preview_enabled: false,
//     longform_notetweets_rich_text_read_enabled: true,
//     longform_notetweets_inline_media_enabled: true,
//     articles_preview_enabled: true,
//     rweb_video_timestamps_enabled: true,
//     rweb_tipjar_consumption_enabled: true,
//     responsive_web_graphql_exclude_directive_enabled: true,
//     verified_phone_label_enabled: false,
//     freedom_of_speech_not_reach_fetch_enabled: true,
//     standardized_nudges_misinfo: true,
//     tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
//     responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
//     responsive_web_graphql_timeline_navigation_enabled: true,
//     responsive_web_enhance_cards_enabled: false
//   };
  
//   const body = {
//     variables,
//     features,
//     queryId
//   };
  
//   const bases = ['https://x.com/i/api/graphql', 'https://twitter.com/i/api/graphql'];
  
//   for (const base of bases) {
//     try {
//       const response = await makeTwitterRequest(`${base}/${queryId}/CreateTweet`, {
//         method: 'POST',
//         headers: {
//           'content-type': 'application/json',
//         },
//         body: JSON.stringify(body)
//       });
      
//       if (response.ok) {
//         const data = await response.json();
        
//         if (data.errors && data.errors.length > 0) {
//           throw new Error(data.errors[0].message || 'Failed to post tweet');
//         }
        
//         if (data.data?.create_tweet?.tweet_results?.result) {
//           return {
//             success: true,
//             tweetId: data.data.create_tweet.tweet_results.result.rest_id
//           };
//         }
        
//         return { success: true };
//       } else {
//         const text = await response.text();
//         console.error(`Post failed with ${base}:`, response.status, text.substring(0, 200));
//       }
//     } catch (error) {
//       console.error(`Post error with ${base}:`, error);
//     }
//   }
  
//   throw new Error('Failed to post tweet. Please refresh your Twitter/X session.');
// }

// // Message handler from popup
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log('Background received:', request.action);
  
//   if (request.action === 'getUserInfo') {
//     getUserInfo()
//       .then(data => sendResponse({ success: true, data }))
//       .catch(error => sendResponse({ success: false, error: error.message }));
//     return true;
//   }
  
//   if (request.action === 'postTweet') {
//     postTweet(request.text)
//       .then(data => sendResponse({ success: true, data }))
//       .catch(error => sendResponse({ success: false, error: error.message }));
//     return true;
//   }
  
//   if (request.action === 'checkLogin') {
//     isLoggedIn()
//       .then(loggedIn => sendResponse({ success: true, loggedIn }))
//       .catch(error => sendResponse({ success: false, error: error.message }));
//     return true;
//   }
// });

// console.log('Quick Tweet background script loaded');


let composeTabId = null;

// Send status update to popup
function sendStatusToPopup(status, message = '', detail = '') {
  chrome.runtime.sendMessage({
    type: 'TWEET_STATUS',
    status,
    message,
    detail
  }).catch(() => {
    // Popup might be closed, ignore error
  });
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  // Step 1: Open X compose
  if (msg.type === "POST_TWEET") {
    sendStatusToPopup('opening');
    
    chrome.tabs.create(
      {
        url: "https://x.com/compose/tweet",
        active: false
      },
      (tab) => {
        composeTabId = tab.id;

        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === composeTabId && info.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);

            sendStatusToPopup('typing');
            
            chrome.scripting.executeScript({
              target: { tabId },
              files: ["contentScript.js"]
            }, () => {
              chrome.tabs.sendMessage(tabId, {
                type: "INJECT_TWEET",
                tweet: msg.tweet
              });
            });
          }
        });
      }
    );
  }

  // Forward status updates from content script to popup
  if (msg.type === "TWEET_STATUS_UPDATE") {
    sendStatusToPopup(msg.status, msg.message, msg.detail);
  }

  // Step 2: Close tab after successful post
  if (msg.type === "TWEET_POSTED" && composeTabId) {
    sendStatusToPopup('success', 'Tweet posted successfully!');
    chrome.tabs.remove(composeTabId);
    composeTabId = null;
  }

  // Handle failure
  if (msg.type === "TWEET_FAILED" && composeTabId) {
    console.error("Tweet failed:", msg.error);
    sendStatusToPopup('error', msg.error || 'Failed to post tweet');
    chrome.tabs.remove(composeTabId);
    composeTabId = null;
  }
});
