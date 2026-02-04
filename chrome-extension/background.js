// Twitter API endpoints
const TWITTER_API_BASE = 'https://twitter.com/i/api';
const TWITTER_GRAPHQL = 'https://twitter.com/i/api/graphql';

// Cache for tokens
let cachedCt0 = null;
let cachedAuthToken = null;

// Get ct0 cookie (CSRF token)
async function getCt0Token() {
  try {
    const cookie = await chrome.cookies.get({
      url: 'https://twitter.com',
      name: 'ct0'
    });
    
    if (cookie) {
      cachedCt0 = cookie.value;
      return cookie.value;
    }
    
    // Try x.com as well
    const xCookie = await chrome.cookies.get({
      url: 'https://x.com',
      name: 'ct0'
    });
    
    if (xCookie) {
      cachedCt0 = xCookie.value;
      return xCookie.value;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting ct0:', error);
    return null;
  }
}

// Get auth_token cookie
async function getAuthToken() {
  try {
    const cookie = await chrome.cookies.get({
      url: 'https://twitter.com',
      name: 'auth_token'
    });
    
    if (cookie) {
      cachedAuthToken = cookie.value;
      return cookie.value;
    }
    
    // Try x.com
    const xCookie = await chrome.cookies.get({
      url: 'https://x.com',
      name: 'auth_token'
    });
    
    if (xCookie) {
      cachedAuthToken = xCookie.value;
      return xCookie.value;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting auth_token:', error);
    return null;
  }
}

// Check if user is logged in
async function isLoggedIn() {
  const authToken = await getAuthToken();
  return !!authToken;
}

// Get common headers for Twitter API
async function getTwitterHeaders() {
  const ct0 = await getCt0Token();
  
  if (!ct0) {
    throw new Error('Not logged in to Twitter');
  }
  
  return {
    'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'x-csrf-token': ct0,
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'en',
    'content-type': 'application/json',
  };
}

// Fetch user info
async function getUserInfo() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    throw new Error('Please log in to Twitter first');
  }
  
  const headers = await getTwitterHeaders();
  
  // Use the viewer endpoint to get current user
  const queryId = 'oMJBTitpNh7CwzP8Y9Pazg';
  const variables = {
    withCommunitiesMemberships: false,
    withSubscribedTab: false,
    withCommunitiesCreation: false
  };
  const features = {
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true
  };
  
  const url = `${TWITTER_GRAPHQL}/${queryId}/Viewer?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(features))}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include'
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error('User info error:', response.status, text);
    throw new Error('Failed to fetch user info');
  }
  
  const data = await response.json();
  
  if (data.data?.viewer?.user_results?.result) {
    const user = data.data.viewer.user_results.result.legacy;
    const userCore = data.data.viewer.user_results.result;
    
    return {
      id: userCore.rest_id,
      name: user.name,
      screenName: user.screen_name,
      profileImageUrl: user.profile_image_url_https?.replace('_normal', '_bigger') || user.profile_image_url_https
    };
  }
  
  throw new Error('Could not parse user info');
}

// Post a tweet
async function postTweet(text) {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    throw new Error('Please log in to Twitter first');
  }
  
  const headers = await getTwitterHeaders();
  
  const queryId = 'tTsjMKyhajZvK4q76mpIBg';
  
  const variables = {
    tweet_text: text,
    dark_request: false,
    media: {
      media_entities: [],
      possibly_sensitive: false
    },
    semantic_annotation_ids: []
  };
  
  const features = {
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    tweetypie_unmention_optimization_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    articles_preview_enabled: true,
    rweb_video_timestamps_enabled: true,
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_enhance_cards_enabled: false
  };
  
  const body = {
    variables,
    features,
    queryId
  };
  
  const response = await fetch(`${TWITTER_GRAPHQL}/${queryId}/CreateTweet`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error('Post tweet error:', response.status, text);
    
    if (response.status === 403) {
      throw new Error('Permission denied. Please refresh your Twitter session.');
    }
    
    throw new Error('Failed to post tweet');
  }
  
  const data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0].message || 'Failed to post tweet');
  }
  
  if (data.data?.create_tweet?.tweet_results?.result) {
    return {
      success: true,
      tweetId: data.data.create_tweet.tweet_results.result.rest_id
    };
  }
  
  return { success: true };
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getUserInfo') {
    getUserInfo()
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'postTweet') {
    postTweet(request.text)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'checkLogin') {
    isLoggedIn()
      .then(loggedIn => sendResponse({ success: true, loggedIn }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Clear cache on cookie changes
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cookie.name === 'ct0' || changeInfo.cookie.name === 'auth_token') {
    cachedCt0 = null;
    cachedAuthToken = null;
  }
});
