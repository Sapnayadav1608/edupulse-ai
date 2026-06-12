const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const SYSTEM_CONTEXT = `You are EduPulse AI — a smart, friendly, and conversational AI assistant inside a college management app called EduPulse AI.

Your Personality:
- Talk like a knowledgeable best friend, not a formal bot
- Be warm, witty, empathetic, and encouraging
- Use casual but clear language — short sentences, natural flow
- React naturally: celebrate wins, empathize with stress, laugh at jokes
- Remember the FULL conversation and refer back to earlier things said
- Ask follow-up questions to keep the conversation going naturally
- Match the user's energy — if they're casual, be casual; if they need help, be focused

What you can do (answer ANYTHING):
- General knowledge, fun facts, current events, philosophy, science, history
- Jokes, riddles, casual chit-chat, opinions
- Academic help: DSA, DBMS, OS, CN, Maths, Physics, Programming, Projects
- Career guidance: placements, resumes, interviews, LinkedIn, internships
- Personal advice: stress, motivation, time management, relationships
- Explain ANY concept with real-world analogies and examples
- Help debug code if user shares it

Rules:
- NEVER give a canned/template response — always respond naturally to what was JUST said
- Keep casual replies SHORT (1-3 sentences) — only elaborate when asked or needed
- Use emojis naturally (1-2 per message max)
- Always end with something that invites a reply
- If user says something emotional — respond with empathy FIRST, advice later
- Respond in EXACTLY the same language/style the user uses — Hindi, English, Hinglish, all fine`;

// POST /api/chatbot/message
const sendMessage = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Try Gemini
    if (apiKey && apiKey !== 'your_gemini_api_key') {
      const genAI  = new GoogleGenerativeAI(apiKey);
      const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-lite'];

      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_CONTEXT });
          const chatHistory = history.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
          }));
          const chat = model.startChat({
            history: chatHistory,
            generationConfig: { maxOutputTokens: 512, temperature: 0.85, topP: 0.92, topK: 40 },
          });
          const result = await chat.sendMessage(message);
          return res.json({ success: true, reply: result.response.text(), source: 'gemini' });
        } catch (e) {
          console.error(`[${modelName}] error:`, e.message?.slice(0, 120));
          continue;
        }
      }
    }

    // 2. Fallback to Python NLP
    try {
      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const nlpRes = await axios.post(`${AI_SERVICE_URL}/chatbot`, { message }, { timeout: 5000 });
      if (nlpRes.data.success) {
        return res.json({ success: true, reply: nlpRes.data.reply, source: 'nlp' });
      }
    } catch { /* NLP offline */ }

    // 3. Improved NLP fallback
    res.json({ success: true, reply: getSmartReply(message, history), source: 'fallback' });

  } catch (error) {
    console.error('Chatbot Error:', error.message);
    res.json({ success: true, reply: getSmartReply(req.body.message, []), source: 'fallback' });
  }
};

// ── Improved NLP Fallback ─────────────────────────────────────────────────────

const KB = [
  {
    keys: ['hi', 'hello', 'hey', 'hii', 'helo', 'sup', 'yo', 'namaste', 'hola', 'good morning', 'good evening', 'wassup', 'whats up'],
    reply: () => [
      "Hey! 👋 What's up? Ask me anything — academics, career, or just chill!",
      "Hello! 😊 Kya chal raha hai? What's on your mind?",
      "Hey there! Need help with something or just wanna chat? 😄",
      "Namaste! 🙏 Batao kya chahiye — padhai, placement, ya kuch aur?",
    ][Math.floor(Math.random() * 4)],
  },
  {
    keys: ['how are you', 'kaisa hai', 'kya haal', 'kaise ho', 'you okay', 'how r u'],
    reply: () => "Ekdum mast! 😄 Always ready to help. Tu bata — studies chal rahi hain smoothly?",
  },
  {
    keys: ['thank', 'thanks', 'shukriya', 'dhanyawad', 'great help', 'helpful', 'awesome'],
    reply: () => "Anytime yaar! 😊 Kuch aur poochna ho toh batao — main hoon hi isliye!",
  },
  {
    keys: ['joke', 'funny', 'hasao', 'make me laugh', 'comedy'],
    reply: () => [
      "Why do programmers prefer dark mode? 🌑 Because light attracts bugs! 😂",
      "A SQL query walks into a bar... 'Can I JOIN you?' 😄",
      "Why did the student eat his homework? Teacher said it was a piece of cake! 🎂",
      "Ek banda apne professor se bola: Sir mujhe A grade chahiye. Professor: Toh pehle A jaisa kaam karo! 😅",
    ][Math.floor(Math.random() * 4)],
  },
  {
    keys: ['stress', 'stressed', 'tired', 'thak', 'anxious', 'worried', 'tension', 'pareshaan', 'overwhelm', 'burnout'],
    reply: () => "Hey, it's completely okay to feel this way 💙 Ek chhoti break le, breathe kar. Specifically kya stress kar raha hai? Let's figure it out together.",
  },
  {
    keys: ['sad', "can't do", 'give up', 'depressed', 'hopeless', 'nahi ho raha', 'quit', 'dropout', 'useless'],
    reply: () => "I hear you 🤗 Struggling doesn't define you — har topper kabhi na kabhi fail hua hai. Baat kar mere se, kya hua?",
  },
  {
    keys: ['motivat', 'inspire', 'encourage', 'boost', 'confidence', 'keep going', 'believe'],
    reply: () => "You've got this! 💪 Consistency beats talent every single day. Ek step at a time — aaj ka kaam aaj karo, baaki sab follow karega. Kya goal hai tera?",
  },
  {
    keys: ['dsa', 'data structure', 'algorithm', 'linked list', 'binary tree', 'graph', 'stack', 'queue', 'heap', 'sorting', 'dynamic programming', 'dp', 'recursion', 'backtracking', 'leetcode', 'hackerrank', 'binary search'],
    reply: () => "**Data Structures & Algorithms** 🔑\n\n**Best Study Order:**\n1. Arrays & Strings\n2. Linked List, Stack, Queue\n3. Binary Trees & BST\n4. Graphs (BFS, DFS)\n5. Dynamic Programming\n6. Hashing & Heaps\n\n**Time Complexities:**\n• Binary Search → O(log n)\n• Merge Sort → O(n log n)\n• Hash Table → O(1) avg\n• BFS/DFS → O(V+E)\n\n**Practice Plan:**\n• Week 1-2: LeetCode Easy (arrays/strings)\n• Week 3-4: Medium (trees/graphs)\n• Week 5+: Hard + company-specific\n\n💡 Daily 1 problem — consistency is everything!",
  },
  {
    keys: ['dbms', 'database', 'sql', 'mysql', 'mongodb', 'normalization', 'join', 'schema', 'acid', 'transaction', 'index', 'primary key', 'foreign key', 'nosql', 'query'],
    reply: () => "**DBMS — Placement Favourite** 🗄️\n\n**Must-Know Topics:**\n• Normalization: 1NF → 2NF → 3NF → BCNF\n• JOINs: INNER, LEFT, RIGHT, FULL OUTER\n• ACID: Atomicity, Consistency, Isolation, Durability\n• Indexing: B-Tree, Hash Index\n\n**Key SQL Commands:**\n`SELECT, INSERT, UPDATE, DELETE, GROUP BY, HAVING`\n\n**Top Interview Qs:**\n• DELETE vs TRUNCATE vs DROP?\n• What is a composite key?\n• SQL vs NoSQL — when to use which?\n\n💡 DBMS is asked in almost every placement interview!",
  },
  {
    keys: ['operating system', 'process', 'thread', 'scheduling', 'deadlock', 'memory management', 'paging', 'virtual memory', 'semaphore', 'mutex', 'fcfs', 'round robin', 'sjf', 'thrashing', 'context switch'],
    reply: () => "**Operating Systems** 🖥️\n\n**Key Topics:**\n• Scheduling: FCFS, SJF, Round Robin, Priority\n• Deadlock: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait\n• Memory: Paging, Segmentation, Virtual Memory\n• Sync: Mutex, Semaphore, Monitor\n\n**Formulas:**\n• Turnaround Time = Completion − Arrival\n• Waiting Time = Turnaround − Burst\n\n**Top Interview Qs:**\n• Process vs Thread?\n• What is thrashing?\n• Explain Banker's Algorithm\n\n💡 Draw Gantt charts for scheduling — helps in exams!",
  },
  {
    keys: ['computer network', 'networking', 'tcp', 'udp', 'http', 'https', 'dns', 'osi', 'router', 'protocol', 'subnet', 'bandwidth', 'firewall', 'vpn', 'handshake', 'mac address', 'ip address'],
    reply: () => "**Computer Networks** 🌐\n\n**OSI Model (7 Layers):**\n7. Application (HTTP, DNS, FTP)\n4. Transport (TCP, UDP)\n3. Network (IP, Routing)\n2. Data Link (MAC)\n\n**TCP vs UDP:**\n• TCP → Reliable, connection-based (HTTP, Email)\n• UDP → Fast, no guarantee (Video calls, Gaming)\n\n**Top Interview Qs:**\n• What happens when you type google.com?\n• 3-way handshake: SYN → SYN-ACK → ACK\n• IPv4 vs IPv6?\n\n💡 CN + OS + DBMS = Core CS for placements!",
  },
  {
    keys: ['python', 'django', 'flask', 'pandas', 'numpy', 'matplotlib', 'pip', 'list comprehension', 'lambda', 'decorator', 'generator'],
    reply: () => "**Python** 🐍\n\n**Core Concepts:**\n• Lists, Tuples, Dicts, Sets\n• List comprehension: `[x*2 for x in range(10)]`\n• Lambda: `f = lambda x: x**2`\n• Decorators, Generators, OOP\n\n**Libraries:**\n• NumPy — arrays | Pandas — data\n• Matplotlib — charts | Flask/Django — web\n\n**Free Resources:**\n• CS50P Harvard (free) | realpython.com\n\n💡 Build 2-3 projects aur GitHub pe push karo — that's your portfolio!",
  },
  {
    keys: ['javascript', 'react', 'nodejs', 'node js', 'express', 'frontend', 'backend', 'fullstack', 'mern', 'html', 'css', 'dom', 'async', 'promise', 'typescript'],
    reply: () => "**JavaScript & Web Dev** 💻\n\n**Core JS:**\n• var vs let vs const\n• Closures, Hoisting, Scope\n• Promises, async/await\n• Arrow functions, Destructuring\n\n**React Essentials:**\n• useState, useEffect, useContext\n• Props vs State | React Router\n\n**MERN Stack:**\nMongoDB + Express + React + Node.js\n\n**Free Resources:**\n• javascript.info | MDN Web Docs | freeCodeCamp\n\n💡 MERN stack projects are highly valued in placements!",
  },
  {
    keys: ['java', 'oops', 'oop', 'object oriented', 'inheritance', 'polymorphism', 'abstraction', 'encapsulation', 'interface', 'abstract class', 'spring', 'collections', 'jvm'],
    reply: () => "**Java & OOP** ☕\n\n**4 Pillars of OOP:**\n• Encapsulation — data hiding\n• Inheritance — reuse parent class\n• Polymorphism — one interface, many forms\n• Abstraction — hide complexity\n\n**Java Specifics:**\n• Collections: ArrayList, HashMap, LinkedList\n• Exception handling: try-catch-finally\n• Multithreading: Thread, Runnable, synchronized\n\n**Top Interview Qs:**\n• Abstract class vs Interface?\n• String vs StringBuilder vs StringBuffer?\n• Method overloading vs overriding?\n\n💡 Java is the most common language in campus placements!",
  },
  {
    keys: ['c++', 'c language', 'pointer', 'memory leak', 'malloc', 'struct', 'stl', 'vector', 'template', 'overloading'],
    reply: () => "**C/C++** ⚙️\n\n**Key Concepts:**\n• Pointers & References\n• Dynamic Memory: new/delete, malloc/free\n• STL: vector, map, set, queue, priority_queue\n• Templates & Generic Programming\n\n**Pointer Basics:**\n`int *p = &x;  // address of x`\n`*p = 10;      // change value`\n\n**Common Mistakes:**\n• Memory leaks — always free/delete\n• Dangling pointers | Buffer overflow\n\n💡 C++ + STL = go-to for competitive programming!",
  },
  {
    keys: ['machine learning', 'deep learning', 'neural network', 'artificial intelligence', 'classification', 'regression', 'clustering', 'cnn', 'rnn', 'nlp', 'tensorflow', 'pytorch', 'scikit', 'overfitting', 'gradient descent'],
    reply: () => "**Machine Learning** 🤖\n\n**Learning Path:**\n1. Python + NumPy + Pandas\n2. Statistics & Probability\n3. Scikit-learn (ML algorithms)\n4. Deep Learning (TensorFlow/PyTorch)\n\n**Key Algorithms:**\n• Supervised: Linear/Logistic Regression, Decision Tree, SVM, KNN\n• Unsupervised: K-Means, PCA\n• Deep: CNN (images), RNN/LSTM (sequences)\n\n**Important Concepts:**\n• Overfitting vs Underfitting\n• Train/Val/Test split | Cross-validation\n• Gradient Descent | Backpropagation\n\n💡 Build an end-to-end ML project — collect data, train, deploy!",
  },
  {
    keys: ['cgpa', 'marks', 'grade', 'gpa', 'improve marks', 'topper', 'score', 'result'],
    reply: () => "**CGPA Improve Karne ke Tips** 📈\n\n**Biggest Impact:**\n• Attendance — internals directly affect CGPA\n• Assignments — kabhi skip mat karo\n• Previous year papers — last 5 years minimum solve karo\n• Weak subjects — 2-3 identify karo aur extra time do\n• Daily study — 2-3 hrs consistent > last-minute cramming\n\n**Pomodoro:** 25 min study → 5 min break → repeat\n\n**Quick Wins:**\n• Front row mein baitho (faculty notice karta hai!)\n• Doubts poochte raho — shows engagement\n\n💡 Just 2-3 subjects mein 10 marks improve = significant CGPA boost!",
  },
  {
    keys: ['placement', 'interview', 'job', 'company', 'hire', 'campus', 'offer', 'salary', 'career', 'resume', 'cv', 'linkedin', 'internship', 'tcs', 'infosys', 'wipro', 'amazon', 'google', 'microsoft'],
    reply: () => "**Placement Preparation Guide** 💼\n\n**Technical Round:**\n• DSA daily — LeetCode Easy→Medium→Hard\n• DBMS, OS, CN — core concepts revise karo\n• Ek language deep mein jaano (Java/Python/C++)\n\n**HR Round:**\n• 2-min self intro prepare karo\n• Projects thoroughly jaano\n• Research the company before interview!\n\n**Resume Tips:**\n• 1 page, ATS-friendly format\n• GitHub + LinkedIn links add karo\n• Quantify: 'Built X that improved Y by Z%'\n\n⏰ Start 3-6 months before placement season!",
  },
  {
    keys: ['attendance', 'absent', 'bunk', 'proxy', 'detained', 'defaulter', 'leave'],
    reply: () => "**Attendance Information** 📋\n\n• Minimum **75%** required for exam eligibility\n• Below 75% = Risk of detention\n\n**Recovery Tips:**\n• Attend ALL remaining classes — zero bunks\n• Medical certificate submit karo valid absences ke liye\n• Faculty/HOD se immediately baat karo\n• EduPulse AI dashboard pe daily check karo\n\n⚠️ 80% se neeche aao toh turant action lo — wait mat karo!",
  },
  {
    keys: ['exam', 'study', 'prepare', 'revision', 'semester', 'internal', 'final exam', 'timetable', 'schedule', 'syllabus', 'notes'],
    reply: () => "**Exam Preparation Strategy** 📚\n\n**2 Weeks Before:**\n• Subject-wise timetable banao\n• High-weightage topics identify karo\n• Previous year papers collect karo\n\n**1 Week Before:**\n• Active recall — test yourself\n• 3-5 previous papers per subject solve karo\n• Short formula/concept sheets banao\n\n**Day Before:**\n• Light revision only, no new topics\n• 7-8 hours sleep (memory consolidation!)\n\n💡 Previous year papers = highest ROI study activity!",
  },
  {
    keys: ['project', 'final year', 'mini project', 'capstone', 'project idea', 'what to build'],
    reply: () => "**Project Ideas & Tips** 🎓\n\n**Trending Ideas:**\n• AI-based attendance (face recognition)\n• Student performance predictor (ML)\n• E-commerce site (MERN stack)\n• Chat app (Socket.io)\n• Resume builder with AI\n\n**Tech Stack:**\n• Web: MERN | AI: Python+Flask | Mobile: React Native\n\n**Must-Haves:**\n• Proper README + screenshots\n• GitHub pe regularly push karo\n• Demo video for viva\n• Free deployment: Vercel/Render/Railway\n\n💡 EduPulse AI jo tum bana rahe ho — that's already industry-level! 🔥",
  },
  {
    keys: ['blockchain', 'bitcoin', 'crypto', 'ethereum', 'web3', 'nft', 'smart contract'],
    reply: () => "**Blockchain** 🔗\n\nEk digital ledger jo thousands of computers pe share hoti hai.\n\n**Simple analogy:** Google Sheet jo sabhi dekh sakte hain but koi edit/delete nahi kar sakta.\n\n**Key Concepts:**\n• Block — data chunks | Chain — cryptographically linked\n• Decentralized — no single owner\n• Smart Contracts — self-executing code on blockchain\n\n**Use Cases:** Bitcoin, Supply chain, Voting, NFTs\n\n💡 Blockchain + Web3 = high-paying niche field!",
  },
  {
    keys: ['cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'deployment', 'hosting', 'serverless'],
    reply: () => "**Cloud Computing & DevOps** ☁️\n\n**Major Platforms:**\n• AWS — market leader (EC2, S3, Lambda, RDS)\n• Azure — Microsoft | GCP — Google (ML/Data)\n\n**DevOps Tools:**\n• Docker — containerization\n• Kubernetes — orchestration\n• GitHub Actions — CI/CD\n\n**Free Certs to start:**\n• AWS Cloud Practitioner\n• Google Associate Cloud Engineer\n\n💡 Cloud skills = 20-30% salary premium!",
  },
  {
    keys: ['math', 'mathematics', 'calculus', 'algebra', 'matrix', 'statistics', 'probability', 'integration', 'differentiation', 'linear algebra', 'discrete math'],
    reply: () => "**Mathematics** 📐\n\n**Key Topics for CS:**\n• Discrete Math — Sets, Logic, Graph Theory\n• Linear Algebra — Matrix, Eigenvalues (ML essential)\n• Probability & Stats — Bayes theorem, Distributions\n• Calculus — Differentiation, Integration\n\n**Quick Formulas:**\n• d/dx(sin x) = cos x | d/dx(eˣ) = eˣ\n• ∫(1/x)dx = ln|x| + C\n• P(A|B) = P(A∩B)/P(B)\n\n**Resources:** Khan Academy | 3Blue1Brown (YouTube)\n\n💡 Stats + Linear Algebra = Foundation of ML!",
  },
  {
    keys: ['physics', 'mechanics', 'thermodynamics', 'electricity', 'magnetism', 'wave', 'force', 'energy', 'motion', 'ohm'],
    reply: () => "**Physics** ⚡\n\n**Mechanics:**\n• F = ma | KE = ½mv² | PE = mgh\n• Momentum = mv (conserved in isolated systems)\n\n**Electricity:**\n• Ohm's Law: V = IR\n• Power: P = VI = I²R\n\n**Waves:**\n• v = fλ | Speed of light = 3×10⁸ m/s\n\n**Thermodynamics:**\n• 1st Law: Energy is conserved\n• 2nd Law: Entropy always increases\n\n💡 Physics is important in electronics & embedded systems!",
  },
  {
    keys: ['best way to learn', 'how to learn', 'learn programming', 'start coding', 'beginner', 'kaise sikhe', 'coding kaise', 'roadmap', 'where to start'],
    reply: () => "**Programming Sikhne ka Best Way** 💻\n\n**Step-by-Step:**\n1. Ek language chuno — Python (easiest) ya C++ (DSA)\n2. Basics — variables, loops, functions, arrays (2-3 weeks)\n3. Chhote projects banao — calculator, to-do app\n4. DSA practice — LeetCode Easy\n5. Framework sikho — React (web) ya Flask (Python)\n6. Real project banao → GitHub pe push karo\n\n**Free Resources:**\n• CS50 Harvard (best beginner course — FREE)\n• freeCodeCamp | The Odin Project\n\n💡 Theory padhne se nahi — roz code likhne se aata hai! 🔥",
  },
  {
    keys: ['kya karu', 'kya karun', 'samajh nahi', 'help karo', 'batao', 'guide karo', 'confused', 'nahi pata', 'kuch nahi pata'],
    reply: () => "No worries! 😊 Main hoon yahan.\n\nBatao kya chahiye:\n• 📚 Subject (DSA, DBMS, OS, CN, ML, Python, Java)\n• 💼 Placement prep (resume, interview, DSA)\n• 📊 CGPA improve karna\n• 📋 Attendance related\n• 🎓 Project idea\n\nBas topic batao — puri detail de dunga! 🙌",
  },
];

const getSmartReply = (message, history = []) => {
  const msg = message.toLowerCase().trim();

  // Check 'os' separately to avoid false positives on words containing 'os'
  const words = msg.split(/\s+/);
  const hasOS = words.some(w => w === 'os') || msg.includes('operating system');

  for (const entry of KB) {
    // Skip OS entry here, handle separately
    if (entry.keys.includes('operating system') && !hasOS) continue;
    if (entry.keys.some(k => msg.includes(k))) {
      return typeof entry.reply === 'function' ? entry.reply() : entry.reply;
    }
  }

  // Context-aware default based on last bot message
  const lastBot = [...history].reverse().find(h => h.role === 'assistant');
  if (lastBot?.content.includes('DSA'))
    return "DSA ke baare mein aur batao — Arrays, Trees, Graphs, DP — kaunsa topic confuse kar raha hai? 🤔";
  if (lastBot?.content.includes('placement'))
    return "Placement prep mein aur kya help chahiye — technical round, HR, ya resume? 💼";
  if (lastBot?.content.includes('CGPA'))
    return "CGPA ke baare mein specifically — kaunsa subject weak hai ya attendance issue hai? 📊";

  return "Interesting! 🤔 Thoda aur specific batao:\n\n• Kaunsa subject ya topic?\n• Exactly kya jaanna chahte ho?\n\nMain DSA, DBMS, OS, CN, Python, Java, ML, placement, CGPA — sab mein help kar sakta hoon. Just be specific! 😊";
};

module.exports = { sendMessage };
