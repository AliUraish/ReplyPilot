const API_BASE = 'https://api.twitter.com/2';

async function getMyUser(accessToken) {
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`X users/me ${res.status}`);
  const json = await res.json();
  return json.data;
}

async function getMentions({ accessToken, userId, sinceId, maxResults = 50 }) {
  const params = new URLSearchParams({ 'max_results': String(Math.min(50, Math.max(5, maxResults))) });
  if (sinceId) params.set('since_id', sinceId);
  params.set('expansions', 'author_id');
  params.set('user.fields', 'username,name,profile_image_url');
  params.set('tweet.fields', 'created_at,lang,conversation_id,referenced_tweets');

  const res = await fetch(`${API_BASE}/users/${userId}/mentions?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`X mentions ${res.status}`);
  return res.json();
}

async function postReply({ accessToken, text, inReplyToTweetId }) {
  const body = { text, reply: { in_reply_to_tweet_id: inReplyToTweetId } };
  const res = await fetch(`${API_BASE}/tweets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`X post ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

module.exports = {
  getMyUser,
  getMentions,
  postReply,
};

