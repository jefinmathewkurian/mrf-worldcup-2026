const axios = require("axios");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL,
});
const db = admin.database();
const FDORG_KEY = process.env.FDORG_KEY;

// ── All 104 WC 2026 matches — seeded into Firebase if empty
const MATCHES_SEED = [
  {id:1,  r:'A', t1:'Mexico',        f1:'🇲🇽', t2:'South Africa',   f2:'🇿🇦', date:'Jun 11', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:2,  r:'A', t1:'Korea Rep.',    f1:'🇰🇷', t2:'Czechia',        f2:'🇨🇿', date:'Jun 11', time:'22:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:3,  r:'A', t1:'Mexico',        f1:'🇲🇽', t2:'Korea Rep.',     f2:'🇰🇷', date:'Jun 18', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:4,  r:'A', t1:'Czechia',       f1:'🇨🇿', t2:'South Africa',   f2:'🇿🇦', date:'Jun 18', time:'12:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:5,  r:'A', t1:'South Africa',  f1:'🇿🇦', t2:'Korea Rep.',     f2:'🇰🇷', date:'Jun 25', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:6,  r:'A', t1:'Czechia',       f1:'🇨🇿', t2:'Mexico',         f2:'🇲🇽', date:'Jun 25', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:7,  r:'B', t1:'Canada',        f1:'🇨🇦', t2:'Bosnia & Herz.', f2:'🇧🇦', date:'Jun 12', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:8,  r:'B', t1:'Qatar',         f1:'🇶🇦', t2:'Switzerland',    f2:'🇨🇭', date:'Jun 12', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:9,  r:'B', t1:'Canada',        f1:'🇨🇦', t2:'Qatar',          f2:'🇶🇦', date:'Jun 19', time:'22:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:10, r:'B', t1:'Bosnia & Herz.',f1:'🇧🇦', t2:'Switzerland',    f2:'🇨🇭', date:'Jun 19', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:11, r:'B', t1:'Switzerland',   f1:'🇨🇭', t2:'Canada',         f2:'🇨🇦', date:'Jun 26', time:'23:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:12, r:'B', t1:'Bosnia & Herz.',f1:'🇧🇦', t2:'Qatar',          f2:'🇶🇦', date:'Jun 26', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:13, r:'C', t1:'Brazil',        f1:'🇧🇷', t2:'Morocco',        f2:'🇲🇦', date:'Jun 13', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:14, r:'C', t1:'Haiti',         f1:'🇭🇹', t2:'Scotland',       f2:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'Jun 13', time:'18:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:15, r:'C', t1:'Brazil',        f1:'🇧🇷', t2:'Haiti',          f2:'🇭🇹', date:'Jun 20', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:16, r:'C', t1:'Scotland',      f1:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', t2:'Morocco',      f2:'🇲🇦', date:'Jun 20', time:'18:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:17, r:'C', t1:'Morocco',       f1:'🇲🇦', t2:'Haiti',          f2:'🇭🇹', date:'Jun 27', time:'13:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:18, r:'C', t1:'Scotland',      f1:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', t2:'Brazil',       f2:'🇧🇷', date:'Jun 27', time:'18:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:19, r:'D', t1:'Australia',     f1:'🇦🇺', t2:'Türkiye',        f2:'🇹🇷', date:'Jun 12', time:'00:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:20, r:'D', t1:'USA',           f1:'🇺🇸', t2:'Paraguay',       f2:'🇵🇾', date:'Jun 12', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:21, r:'D', t1:'USA',           f1:'🇺🇸', t2:'Australia',      f2:'🇦🇺', date:'Jun 19', time:'18:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:22, r:'D', t1:'Türkiye',       f1:'🇹🇷', t2:'Paraguay',       f2:'🇵🇾', date:'Jun 19', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:23, r:'D', t1:'Türkiye',       f1:'🇹🇷', t2:'USA',            f2:'🇺🇸', date:'Jun 26', time:'22:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:24, r:'D', t1:'Paraguay',      f1:'🇵🇾', t2:'Australia',      f2:'🇦🇺', date:'Jun 26', time:'22:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:25, r:'E', t1:'Germany',       f1:'🇩🇪', t2:'Curaçao',        f2:'🇨🇼', date:'Jun 13', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:26, r:'E', t1:'Côte d\'Ivoire',f1:'🇨🇮', t2:'Ecuador',        f2:'🇪🇨', date:'Jun 13', time:'16:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:27, r:'E', t1:'Germany',       f1:'🇩🇪', t2:'Côte d\'Ivoire', f2:'🇨🇮', date:'Jun 20', time:'20:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:28, r:'E', t1:'Ecuador',       f1:'🇪🇨', t2:'Curaçao',        f2:'🇨🇼', date:'Jun 20', time:'00:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:29, r:'E', t1:'Ecuador',       f1:'🇪🇨', t2:'Germany',        f2:'🇩🇪', date:'Jun 27', time:'18:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:30, r:'E', t1:'Curaçao',       f1:'🇨🇼', t2:'Côte d\'Ivoire', f2:'🇨🇮', date:'Jun 27', time:'16:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:31, r:'F', t1:'Netherlands',   f1:'🇳🇱', t2:'Japan',          f2:'🇯🇵', date:'Jun 14', time:'13:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:32, r:'F', t1:'Sweden',        f1:'🇸🇪', t2:'Tunisia',        f2:'🇹🇳', date:'Jun 14', time:'22:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:33, r:'F', t1:'Tunisia',       f1:'🇹🇳', t2:'Japan',          f2:'🇯🇵', date:'Jun 21', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:34, r:'F', t1:'Netherlands',   f1:'🇳🇱', t2:'Sweden',         f2:'🇸🇪', date:'Jun 21', time:'13:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:35, r:'F', t1:'Tunisia',       f1:'🇹🇳', t2:'Netherlands',    f2:'🇳🇱', date:'Jun 27', time:'16:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:36, r:'F', t1:'Japan',         f1:'🇯🇵', t2:'Sweden',         f2:'🇸🇪', date:'Jun 27', time:'19:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:37, r:'G', t1:'IR Iran',       f1:'🇮🇷', t2:'New Zealand',    f2:'🇳🇿', date:'Jun 15', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:38, r:'G', t1:'Belgium',       f1:'🇧🇪', t2:'Egypt',          f2:'🇪🇬', date:'Jun 15', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:39, r:'G', t1:'New Zealand',   f1:'🇳🇿', t2:'Egypt',          f2:'🇪🇬', date:'Jun 22', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:40, r:'G', t1:'Belgium',       f1:'🇧🇪', t2:'IR Iran',        f2:'🇮🇷', date:'Jun 22', time:'13:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:41, r:'G', t1:'New Zealand',   f1:'🇳🇿', t2:'Belgium',        f2:'🇧🇪', date:'Jun 28', time:'22:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:42, r:'G', t1:'Egypt',         f1:'🇪🇬', t2:'IR Iran',        f2:'🇮🇷', date:'Jun 28', time:'22:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:43, r:'H', t1:'Spain',         f1:'🇪🇸', t2:'Cabo Verde',     f2:'🇨🇻', date:'Jun 14', time:'18:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:44, r:'H', t1:'Saudi Arabia',  f1:'🇸🇦', t2:'Uruguay',        f2:'🇺🇾', date:'Jun 14', time:'19:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:45, r:'H', t1:'Spain',         f1:'🇪🇸', t2:'Saudi Arabia',   f2:'🇸🇦', date:'Jun 21', time:'18:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:46, r:'H', t1:'Uruguay',       f1:'🇺🇾', t2:'Cabo Verde',     f2:'🇨🇻', date:'Jun 21', time:'19:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:47, r:'H', t1:'Cabo Verde',    f1:'🇨🇻', t2:'Saudi Arabia',   f2:'🇸🇦', date:'Jun 28', time:'23:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:48, r:'H', t1:'Uruguay',       f1:'🇺🇾', t2:'Spain',          f2:'🇪🇸', date:'Jun 28', time:'20:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:49, r:'I', t1:'France',        f1:'🇫🇷', t2:'Senegal',        f2:'🇸🇳', date:'Jun 16', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:50, r:'I', t1:'Iraq',          f1:'🇮🇶', t2:'Norway',         f2:'🇳🇴', date:'Jun 16', time:'18:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:51, r:'I', t1:'Senegal',       f1:'🇸🇳', t2:'Iraq',           f2:'🇮🇶', date:'Jun 22', time:'17:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:52, r:'I', t1:'France',        f1:'🇫🇷', t2:'Norway',         f2:'🇳🇴', date:'Jun 22', time:'20:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:53, r:'I', t1:'Norway',        f1:'🇳🇴', t2:'Senegal',        f2:'🇸🇳', date:'Jun 26', time:'16:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:54, r:'I', t1:'Iraq',          f1:'🇮🇶', t2:'France',         f2:'🇫🇷', date:'Jun 26', time:'22:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:55, r:'J', t1:'Argentina',     f1:'🇦🇷', t2:'Algeria',        f2:'🇩🇿', date:'Jun 17', time:'00:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:56, r:'J', t1:'Austria',       f1:'🇦🇹', t2:'Jordan',         f2:'🇯🇴', date:'Jun 15', time:'12:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:57, r:'J', t1:'Argentina',     f1:'🇦🇷', t2:'Austria',        f2:'🇦🇹', date:'Jun 22', time:'12:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:58, r:'J', t1:'Jordan',        f1:'🇯🇴', t2:'Algeria',        f2:'🇩🇿', date:'Jun 22', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:59, r:'J', t1:'Jordan',        f1:'🇯🇴', t2:'Argentina',      f2:'🇦🇷', date:'Jun 29', time:'22:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:60, r:'J', t1:'Algeria',       f1:'🇩🇿', t2:'Austria',        f2:'🇦🇹', date:'Jun 29', time:'19:30 ET', status:'upcoming', score:null, correctPick:null},
  {id:61, r:'K', t1:'Congo DR',      f1:'🇨🇩', t2:'Uzbekistan',     f2:'🇺🇿', date:'Jun 15', time:'19:30 ET', status:'upcoming', score:null, correctPick:null},
  {id:62, r:'K', t1:'Portugal',      f1:'🇵🇹', t2:'Congo DR',       f2:'🇨🇩', date:'Jun 17', time:'13:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:63, r:'K', t1:'Colombia',      f1:'🇨🇴', t2:'Uzbekistan',     f2:'🇺🇿', date:'Jun 17', time:'13:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:64, r:'K', t1:'Portugal',      f1:'🇵🇹', t2:'Uzbekistan',     f2:'🇺🇿', date:'Jun 26', time:'21:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:65, r:'K', t1:'Colombia',      f1:'🇨🇴', t2:'Portugal',       f2:'🇵🇹', date:'Jun 29', time:'17:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:66, r:'K', t1:'Uzbekistan',    f1:'🇺🇿', t2:'Colombia',       f2:'🇨🇴', date:'Jun 29', time:'17:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:67, r:'L', t1:'England',       f1:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', t2:'Croatia',      f2:'🇭🇷', date:'Jun 17', time:'19:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:68, r:'L', t1:'Ghana',         f1:'🇬🇭', t2:'Panama',         f2:'🇵🇦', date:'Jun 16', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:69, r:'L', t1:'England',       f1:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', t2:'Ghana',        f2:'🇬🇭', date:'Jun 23', time:'20:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:70, r:'L', t1:'Panama',        f1:'🇵🇦', t2:'Croatia',        f2:'🇭🇷', date:'Jun 23', time:'16:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:71, r:'L', t1:'Panama',        f1:'🇵🇦', t2:'England',        f2:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'Jun 29', time:'15:00 ET', status:'upcoming', score:null, correctPick:null},
  {id:72, r:'L', t1:'Croatia',       f1:'🇭🇷', t2:'Ghana',          f2:'🇬🇭', date:'Jun 29', time:'17:00 ET', status:'upcoming', score:null, correctPick:null},
];

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

async function seedMatchesIfEmpty() {
  const snap = await db.ref("matches").get();
  if (snap.exists()) {
    console.log("Matches already seeded, skipping.");
    return;
  }
  const seedData = {};
  MATCHES_SEED.forEach(m => { seedData[m.id] = m; });
  await db.ref("matches").set(seedData);
  console.log(`Seeded ${MATCHES_SEED.length} matches into Firebase.`);
}

async function syncResults() {
  let fdMatches;
  try {
    const res = await axios.get(
      "https://api.football-data.org/v4/competitions/WC/matches",
      { headers: { "X-Auth-Token": FDORG_KEY }, timeout: 15000 }
    );
    fdMatches = res.data.matches;
    console.log(`Fetched ${fdMatches.length} matches from API`);
  } catch (err) {
    console.error("API fetch failed:", err.message);
    if (err.response) console.error("Response:", JSON.stringify(err.response.data));
    process.exit(1);
  }

  const matchesSnap = await db.ref("matches").get();
  const ourMatches  = matchesSnap.exists() ? matchesSnap.val() : {};

  const teamPairToId = {};
  Object.entries(ourMatches).forEach(([id, m]) => {
    teamPairToId[`${m.t1}|${m.t2}`] = id;
    teamPairToId[`${m.t2}|${m.t1}`] = id;
  });

  const updates = {};
  for (const fm of fdMatches) {
    const apiHome = TEAM_NAME_MAP[fm.homeTeam?.name] || fm.homeTeam?.name;
    const apiAway = TEAM_NAME_MAP[fm.awayTeam?.name] || fm.awayTeam?.name;
    const matchId = teamPairToId[`${apiHome}|${apiAway}`] || teamPairToId[`${apiAway}|${apiHome}`];
    if (!matchId) { console.warn(`No match found for: ${apiHome} vs ${apiAway}`); continue; }

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

  if (Object.keys(updates).length > 0) {
    await db.ref("/").update(updates);
    console.log(`Updated ${Object.keys(updates).length / 3} matches`);
  } else {
    console.log("No updates needed");
  }
}

async function recalcPoints() {
  const [matchesSnap, playersSnap] = await Promise.all([
    db.ref("matches").get(), db.ref("players").get()
  ]);
  if (!matchesSnap.exists() || !playersSnap.exists()) {
    console.log("No players yet, skipping points recalc.");
    return;
  }
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

async function main() {
  await seedMatchesIfEmpty();  // seeds match list if Firebase is empty
  await syncResults();          // fetches API results and updates Firebase
  await recalcPoints();         // recalculates everyone's points
  process.exit(0);
}

main();
