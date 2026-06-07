const axios = require("axios");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL,
});
const db = admin.database();

const FDORG_KEY = process.env.FDORG_KEY;
const TEAM_NAME_MAP = {
  "Mexico":"Mexico","South Africa":"South Africa","Korea Republic":"Korea Rep.",
  "Czechia":"Czechia","Czech Republic":"Czechia","Canada":"Canada",
  "Bosnia and Herzegovina":"Bosnia & Herz.","Qatar":"Qatar","Switzerland":"Switzerland",
  "Brazil":"Brazil","Morocco":"Morocco","Haiti":"Haiti","Scotland":"Scotland",
  "Australia":"Australia","Türkiye":"Türkiye","Turkey":"Türkiye",
  "United States":"USA","USA":"USA","Paraguay":"Paraguay","Germany":"Germany",
  "Curaçao":"Curaçao","Côte d'Ivoire":"Côte d'Ivoire","Ivory Coast":"Côte d'Ivoire",
  "Ecuador":"Ecuador","Netherlands":"Netherlands","Japan":"Japan","Sweden":"Sweden",
  "Tunisia":"Tunisia","Iran":"IR Iran","IR Iran":"IR Iran","New Zealand":"New Zealand",
  "Belgium":"Belgium","Egypt":"Egypt","Spain":"Spain","Cabo Verde":"Cabo Verde",
  "Cape Verde":"Cabo Verde","Saudi Arabia":"Saudi Arabia","Uruguay":"Uruguay",
  "France":"France","Senegal":"Senegal","Iraq":"Iraq","Norway":"Norway",
  "Argentina":"Argentina","Algeria":"Algeria","Austria":"Austria","Jordan":"Jordan",
  "DR Congo":"Congo DR","Congo DR":"Congo DR","Uzbekistan":"Uzbekistan",
  "Portugal":"Portugal","Colombia":"Colombia","England":"England",
  "Croatia":"Croatia","Ghana":"Ghana","Panama":"Panama",
};

function deriveCorrectPick(home, away) {
  if (home > away) return "w1";
  if (away > home) return "w2";
  return "draw";
}
function deriveStatus(s) {
  if (s === "FINISHED") return "done";
  if (s === "IN_PLAY" || s === "PAUSED") return "live";
  return "upcoming";
}

async function main() {
  // 1. Fetch results from football-data.org
  let fdMatches;
  try {
    const res = await axios.get(
      "https://api.football-data.org/v4/competitions/WC/matches?season=2026",
      { headers: { "X-Auth-Token": FDORG_KEY }, timeout: 15000 }
    );
    fdMatches = res.data.matches;
    console.log(`Fetched ${fdMatches.length} matches`);
  } catch (err) {
    console.error("API fetch failed:", err.message);
    process.exit(1);
  }

  // 2. Read our matches from Firebase
  const matchesSnap = await db.ref("matches").get();
  const ourMatches  = matchesSnap.exists() ? matchesSnap.val() : {};
  const teamPairToId = {};
  Object.entries(ourMatches).forEach(([id, m]) => {
    teamPairToId[`${m.t1}|${m.t2}`] = id;
    teamPairToId[`${m.t2}|${m.t1}`] = id;
  });

  // 3. Build updates
  const updates = {};
  for (const fm of fdMatches) {
    const apiHome = TEAM_NAME_MAP[fm.homeTeam?.name] || fm.homeTeam?.name;
    const apiAway = TEAM_NAME_MAP[fm.awayTeam?.name] || fm.awayTeam?.name;
    const matchId = teamPairToId[`${apiHome}|${apiAway}`] || teamPairToId[`${apiAway}|${apiHome}`];
    if (!matchId) continue;
    const ourMatch  = ourMatches[matchId];
    const newStatus = deriveStatus(fm.status);
    if (newStatus === "upcoming" && ourMatch.status === "upcoming") continue;
    const homeScore = fm.score?.fullTime?.home ?? null;
    const awayScore = fm.score?.fullTime?.away ?? null;
    const isReversed = ourMatch.t1 === apiAway;
    const correctPick = newStatus === "done" && homeScore !== null
      ? deriveCorrectPick(isReversed ? awayScore : homeScore, isReversed ? homeScore : awayScore)
      : ourMatch.correctPick ?? null;
    const scoreStr = homeScore !== null
      ? `${isReversed ? awayScore : homeScore} – ${isReversed ? homeScore : awayScore}`
      : null;
    updates[`matches/${matchId}/status`]      = newStatus;
    updates[`matches/${matchId}/score`]       = scoreStr;
    updates[`matches/${matchId}/correctPick`] = correctPick;
  }

  // 4. Write to Firebase
  if (Object.keys(updates).length > 0) {
    await db.ref("/").update(updates);
    console.log(`Updated ${Object.keys(updates).length / 3} matches`);
  } else {
    console.log("No updates needed");
  }

  // 5. Recalculate points
  await recalcPoints();
  process.exit(0);
}

async function recalcPoints() {
  const [matchesSnap, playersSnap] = await Promise.all([
    db.ref("matches").get(), db.ref("players").get()
  ]);
  if (!matchesSnap.exists() || !playersSnap.exists()) return;
  const matches = matchesSnap.val();
  const players = playersSnap.val();
  const results = {};
  Object.entries(matches).forEach(([id, m]) => {
    if (m.status === "done" && m.correctPick) results[id] = m.correctPick;
  });
  const pointUpdates = {};
  Object.entries(players).forEach(([uid, player]) => {
    if (!player.picks) return;
    let pts = 0, correct = 0, total = 0, streak = 0, streakBroken = false;
    Object.keys(results).forEach((id) => {
      const userPick = player.picks[id];
      if (!userPick) return;
      total++;
      if (userPick === results[id]) { pts += 10; correct++; if (!streakBroken) streak++; }
      else { streakBroken = true; streak = 0; }
    });
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    pointUpdates[`players/${uid}/pts`]     = pts;
    pointUpdates[`players/${uid}/correct`] = correct;
    pointUpdates[`players/${uid}/total`]   = total;
    pointUpdates[`players/${uid}/acc`]     = acc;
    pointUpdates[`players/${uid}/streak`]  = streak;
  });
  if (Object.keys(pointUpdates).length > 0) {
    await db.ref("/").update(pointUpdates);
    console.log(`Points recalculated for ${Object.keys(players).length} players`);
  }
}

main();
