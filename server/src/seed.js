// Seed data: real companies, sources, tools, models, research papers and seed news.
// Runs only when tables are empty (first boot).

import { slugify } from './utils.js';

const J = (v) => JSON.stringify(v);

const COMPANIES = [
  { name: 'OpenAI', website: 'https://openai.com', founded: '2015', hq: 'San Francisco, CA', description: 'AI research and deployment company behind the GPT model family, ChatGPT, DALL-E and Sora. Focuses on building safe artificial general intelligence.', focus_areas: ['Large Language Models', 'Generative AI', 'AI Safety', 'Consumer Products'] },
  { name: 'Google DeepMind', website: 'https://deepmind.google', founded: '2010', hq: 'London, United Kingdom', description: 'Google\u2019s central AI research lab, formed by merging DeepMind and Google Brain. Creator of AlphaGo, AlphaFold and the Gemini model family.', focus_areas: ['Foundation Models', 'AI for Science', 'Reinforcement Learning', 'AI Safety'] },
  { name: 'Anthropic', website: 'https://www.anthropic.com', founded: '2021', hq: 'San Francisco, CA', description: 'AI safety company developing the Claude family of models and pioneering interpretability and constitutional AI research.', focus_areas: ['AI Safety', 'Large Language Models', 'Interpretability', 'Enterprise AI'] },
  { name: 'Meta AI', website: 'https://ai.meta.com', founded: '2013', hq: 'Menlo Park, CA', description: 'Meta\u2019s AI research organization (FAIR and GenAI), developer of the open-weight Llama model family and Segment Anything.', focus_areas: ['Open Source Models', 'Computer Vision', 'Social AI', 'AR/VR'] },
  { name: 'xAI', website: 'https://x.ai', founded: '2023', hq: 'Palo Alto, CA', description: 'Elon Musk\u2019s AI company building the Grok family of models, integrated with the X platform and trained on the Colossus supercluster.', focus_areas: ['Large Language Models', 'Conversational AI', 'Supercomputing'] },
  { name: 'Microsoft', website: 'https://www.microsoft.com', founded: '1975', hq: 'Redmond, WA', description: 'Enterprise software giant and OpenAI\u2019s primary partner; ships Copilot AI assistants across Windows, Office, GitHub and Azure.', focus_areas: ['Enterprise AI', 'Cloud Infrastructure', 'AI Coding', 'Productivity'] },
  { name: 'NVIDIA', website: 'https://www.nvidia.com', founded: '1993', hq: 'Santa Clara, CA', description: 'Dominant supplier of GPUs for AI training and inference; builds CUDA, DGX systems, and open models like Nemotron.', focus_areas: ['AI Hardware', 'GPUs', 'Data Centers', 'AI Software Stack'] },
  { name: 'Mistral AI', website: 'https://mistral.ai', founded: '2023', hq: 'Paris, France', description: 'European frontier AI lab producing open-weight and commercial LLMs including Mistral Large and the Mixtral family.', focus_areas: ['Large Language Models', 'Open Weights', 'Sovereign AI'] },
  { name: 'Hugging Face', website: 'https://huggingface.co', founded: '2016', hq: 'New York, NY', description: 'The hub for open-source machine learning: hosts models, datasets and Spaces, and maintains the Transformers library.', focus_areas: ['Open Source', 'ML Platform', 'Community', 'Transformers'] },
  { name: 'Perplexity', website: 'https://www.perplexity.ai', founded: '2022', hq: 'San Francisco, CA', description: 'Answer engine company combining LLMs with live web search and citations to deliver real-time, sourced answers.', focus_areas: ['AI Search', 'Answer Engine', 'Consumer Products'] },
  { name: 'DeepSeek', website: 'https://www.deepseek.com', founded: '2023', hq: 'Hangzhou, China', description: 'Chinese AI lab known for highly efficient open models DeepSeek-V3 and reasoning model DeepSeek-R1, trained at a fraction of typical cost.', focus_areas: ['Large Language Models', 'Reasoning Models', 'Efficient Training'] },
  { name: 'Stability AI', website: 'https://stability.ai', founded: '2019', hq: 'London, United Kingdom', description: 'Creator of Stable Diffusion, one of the most widely used open image generation model families, plus audio and 3D models.', focus_areas: ['Image Generation', 'Open Source', 'Generative Media'] },
  { name: 'Cohere', website: 'https://cohere.com', founded: '2019', hq: 'Toronto, Canada', description: 'Enterprise-focused AI lab offering the Command LLM family, industry-leading embeddings and retrieval (RAG) tools.', focus_areas: ['Enterprise AI', 'Embeddings', 'Retrieval', 'LLMs'] },
  { name: 'Apple', website: 'https://www.apple.com', founded: '1976', hq: 'Cupertino, CA', description: 'Consumer electronics company integrating on-device and cloud AI through Apple Intelligence across iPhone, iPad and Mac.', focus_areas: ['On-device AI', 'Consumer Products', 'Privacy', 'Apple Intelligence'] }
];

const SOURCES = [
  { name: 'OpenAI News', url: 'https://openai.com/news/', feed_url: 'https://openai.com/news/rss.xml', feed_type: 'rss', category: 'official', priority: 5, logo_url: 'https://www.google.com/s2/favicons?domain=openai.com&sz=128' },
  { name: 'Google DeepMind Blog', url: 'https://deepmind.google/blog/', feed_url: 'https://deepmind.google/blog/rss.xml', feed_type: 'rss', category: 'official', priority: 5, logo_url: 'https://www.google.com/s2/favicons?domain=deepmind.google&sz=128' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/', feed_url: 'https://blog.google/technology/ai/rss/', feed_type: 'rss', category: 'official', priority: 5, logo_url: 'https://www.google.com/s2/favicons?domain=blog.google&sz=128' },
  // The four sources below are catalogued but shipped inactive: Anthropic, Meta AI,
  // Mistral and Cohere do not expose a public RSS/Atom feed at any stable path (verified
  // 404/400/HTML). Re-point feed_url and set active:1 if they publish one later.
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news', feed_url: 'https://www.anthropic.com/rss.xml', feed_type: 'rss', category: 'official', priority: 5, active: 0, logo_url: 'https://www.google.com/s2/favicons?domain=anthropic.com&sz=128' },
  { name: 'Meta AI Blog', url: 'https://ai.meta.com/blog/', feed_url: 'https://ai.meta.com/blog/rss/', feed_type: 'rss', category: 'official', priority: 4, active: 0, logo_url: 'https://www.google.com/s2/favicons?domain=ai.meta.com&sz=128' },
  { name: 'Microsoft Research Blog', url: 'https://www.microsoft.com/en-us/research/blog/', feed_url: 'https://www.microsoft.com/en-us/research/feed/', feed_type: 'rss', category: 'official', priority: 4, logo_url: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128' },
  { name: 'NVIDIA Blog', url: 'https://blogs.nvidia.com/', feed_url: 'https://blogs.nvidia.com/feed/', feed_type: 'rss', category: 'official', priority: 4, logo_url: 'https://www.google.com/s2/favicons?domain=nvidia.com&sz=128' },
  { name: 'Mistral AI News', url: 'https://mistral.ai/news/', feed_url: 'https://mistral.ai/feed.xml', feed_type: 'rss', category: 'official', priority: 4, active: 0, logo_url: 'https://www.google.com/s2/favicons?domain=mistral.ai&sz=128' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog', feed_url: 'https://huggingface.co/blog/feed.xml', feed_type: 'rss', category: 'opensource', priority: 4, logo_url: 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=128' },
  { name: 'Cohere Blog', url: 'https://cohere.com/blog', feed_url: 'https://cohere.com/blog/rss.xml', feed_type: 'rss', category: 'official', priority: 3, active: 0, logo_url: 'https://www.google.com/s2/favicons?domain=cohere.com&sz=128' },
  { name: 'arXiv cs.AI / cs.LG', url: 'https://arxiv.org/list/cs.AI/recent', feed_url: 'http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=25', feed_type: 'arxiv', category: 'research', priority: 5, logo_url: 'https://www.google.com/s2/favicons?domain=arxiv.org&sz=128' },
  { name: 'GitHub Trending AI', url: 'https://github.com/trending', feed_url: 'https://api.github.com/search/repositories?q=topic:artificial-intelligence&sort=updated&per_page=15', feed_type: 'github', category: 'opensource', priority: 4, logo_url: 'https://www.google.com/s2/favicons?domain=github.com&sz=128' },
  { name: 'GitHub Trending LLM', url: 'https://github.com/trending', feed_url: 'https://api.github.com/search/repositories?q=topic:llm&sort=updated&per_page=15', feed_type: 'github', category: 'opensource', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=github.com&sz=128' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/', feed_url: 'https://techcrunch.com/category/artificial-intelligence/feed/', feed_type: 'rss', category: 'news', priority: 4, logo_url: 'https://www.google.com/s2/favicons?domain=techcrunch.com&sz=128' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence', feed_url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', feed_type: 'rss', category: 'news', priority: 4, logo_url: 'https://www.google.com/s2/favicons?domain=theverge.com&sz=128' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/', feed_url: 'https://venturebeat.com/category/ai/feed/', feed_type: 'rss', category: 'news', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=venturebeat.com&sz=128' },
  { name: 'Ars Technica AI', url: 'https://arstechnica.com/ai/', feed_url: 'https://arstechnica.com/ai/feed/', feed_type: 'rss', category: 'news', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=arstechnica.com&sz=128' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/', feed_url: 'https://www.technologyreview.com/feed/', feed_type: 'rss', category: 'news', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=technologyreview.com&sz=128' },
  { name: 'MIT News \u2014 AI', url: 'https://news.mit.edu/topic/artificial-intelligence2', feed_url: 'https://news.mit.edu/rss/topic/artificial-intelligence2', feed_type: 'rss', category: 'research', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=news.mit.edu&sz=128' },
  { name: 'The Decoder', url: 'https://the-decoder.com/', feed_url: 'https://the-decoder.com/feed/', feed_type: 'rss', category: 'news', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=the-decoder.com&sz=128' },
  { name: 'MarkTechPost', url: 'https://www.marktechpost.com/', feed_url: 'https://www.marktechpost.com/feed/', feed_type: 'rss', category: 'news', priority: 2, logo_url: 'https://www.google.com/s2/favicons?domain=marktechpost.com&sz=128' },
  { name: 'Last Week in AI', url: 'https://lastweekin.ai/', feed_url: 'https://lastweekin.ai/feed', feed_type: 'rss', category: 'news', priority: 2, logo_url: 'https://www.google.com/s2/favicons?domain=lastweekin.ai&sz=128' },
  { name: 'Simon Willison\u2019s Weblog', url: 'https://simonwillison.net/', feed_url: 'https://simonwillison.net/atom/everything/', feed_type: 'atom', category: 'news', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=simonwillison.net&sz=128' },
  { name: 'GitHub Blog \u2014 AI', url: 'https://github.blog/ai-and-ml/', feed_url: 'https://github.blog/ai-and-ml/feed/', feed_type: 'rss', category: 'opensource', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=github.blog&sz=128' },
  { name: 'AWS Machine Learning Blog', url: 'https://aws.amazon.com/blogs/machine-learning/', feed_url: 'https://aws.amazon.com/blogs/machine-learning/feed/', feed_type: 'rss', category: 'news', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=128' },
  // ---- API / keyless aggregator sources (§4-§13) ----
  // Priority note: this codebase's scale is 5 = highest. §6 ranks aggregators
  // below official/research sources, so these sit at priority 3 — when the same
  // story also arrives from an official source (priority 5), clustering's
  // importance ordering keeps the official one canonical.
  // GNews + NewsAPI gracefully no-op (return []) when their key is absent, so
  // they are shipped active: adding a key to .env enables them with no DB change.
  { name: 'GNews AI', url: 'https://gnews.io', feed_url: 'https://gnews.io/api/v4/search', feed_type: 'gnews', category: 'aggregator', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=gnews.io&sz=128' },
  { name: 'NewsAPI AI', url: 'https://newsapi.org', feed_url: 'https://newsapi.org/v2/everything', feed_type: 'newsapi', category: 'aggregator', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=newsapi.org&sz=128' },
  // GDELT DOC 2.0 — keyless, supplementary international coverage (§9).
  { name: 'GDELT AI News', url: 'https://www.gdeltproject.org', feed_url: 'https://api.gdeltproject.org/api/v2/doc/doc', feed_type: 'gdelt', category: 'aggregator', priority: 3, logo_url: 'https://www.google.com/s2/favicons?domain=gdeltproject.org&sz=128' },
  // Hugging Face official API — trending/recently-updated models (§12). Keyless.
  { name: 'Hugging Face Models', url: 'https://huggingface.co/models', feed_url: 'https://huggingface.co/api/models?sort=modified&direction=-1&limit=30', feed_type: 'huggingface', category: 'opensource', priority: 4, logo_url: 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=128' }
];

const TOOL_CATEGORIES = [
  'Research', 'Coding', 'AI Agents', 'Image Generation', 'Video Generation', 'Audio',
  'Writing', 'Productivity', 'Design', 'Marketing', 'Education', 'Business',
  '3D & Spatial', 'Developer Infrastructure'
];

// tools: [name, company, category, subcategory, pricing_type, open_source, website, description, platforms, capabilities, tags, featured]
const TOOLS = [
  ['Cursor', 'Anysphere', 'Coding', 'AI Code Editor', 'Freemium', 0, 'https://cursor.com', 'AI-first code editor built on VS Code with deep codebase understanding, multi-file edits and an agentic composer for autonomous coding tasks.', ['macOS', 'Windows', 'Linux'], ['Code Completion', 'Chat with Codebase', 'Agentic Edits', 'Multi-file Refactoring'], ['editor', 'ide', 'coding'], 1],
  ['GitHub Copilot', 'Microsoft', 'Coding', 'AI Pair Programmer', 'Paid', 0, 'https://github.com/features/copilot', 'AI pair programmer integrated into VS Code, JetBrains, Visual Studio and Neovim, now with an agent mode that can tackle entire issues.', ['VS Code', 'JetBrains', 'Visual Studio', 'Neovim', 'Web'], ['Code Completion', 'Chat', 'Agent Mode', 'Code Review'], ['copilot', 'coding', 'completion'], 1],
  ['Claude Code', 'Anthropic', 'Coding', 'Terminal Agent', 'Paid', 0, 'https://docs.anthropic.com/en/docs/claude-code', 'Agentic coding tool that lives in your terminal, understands your whole repository and executes multi-step engineering tasks via natural language.', ['Terminal', 'macOS', 'Linux', 'Windows (WSL)'], ['Agentic Coding', 'Repo Understanding', 'Git Integration', 'Test Writing'], ['cli', 'agent', 'coding'], 1],
  ['Windsurf', 'Cognition', 'Coding', 'AI Code Editor', 'Freemium', 0, 'https://windsurf.com', 'Agentic AI code editor (formerly Codeium) with Cascade flows that keep the developer and AI working in sync across the codebase.', ['macOS', 'Windows', 'Linux'], ['Agentic Flows', 'Code Completion', 'Terminal Commands', 'Codebase Awareness'], ['editor', 'ide', 'agent'], 0],
  ['Codex', 'OpenAI', 'Coding', 'Cloud Coding Agent', 'Paid', 0, 'https://openai.com/index/introducing-codex/', 'Cloud-based software engineering agent that runs tasks in parallel sandboxes \u2014 writing features, fixing bugs and opening pull requests.', ['Web', 'CLI'], ['Autonomous Coding', 'Pull Requests', 'Parallel Tasks', 'Sandboxed Execution'], ['agent', 'coding', 'openai'], 1],
  ['Devin', 'Cognition', 'AI Agents', 'Autonomous Engineer', 'Paid', 0, 'https://devin.ai', 'Autonomous AI software engineer that plans, codes, debugs and deploys end-to-end tasks with its own shell, editor and browser.', ['Web', 'Slack'], ['Autonomous Engineering', 'Planning', 'Debugging', 'Deployment'], ['agent', 'autonomous', 'engineering'], 0],
  ['Replit Agent', 'Replit', 'Coding', 'App Builder', 'Paid', 0, 'https://replit.com', 'Builds complete full-stack applications from a natural-language description, handling code, database, deployment and testing.', ['Web', 'iOS', 'Android'], ['App Generation', 'Deployment', 'Database Setup', 'Iterative Building'], ['agent', 'app-builder', 'no-code'], 0],
  ['v0', 'Vercel', 'Coding', 'UI Generation', 'Freemium', 0, 'https://v0.dev', 'Generative UI tool that turns prompts and designs into production-ready React + Tailwind components, wired into the Vercel ecosystem.', ['Web'], ['UI Generation', 'React Components', 'Tailwind', 'Design-to-Code'], ['ui', 'frontend', 'react'], 0],
  ['ChatGPT', 'OpenAI', 'Productivity', 'AI Assistant', 'Freemium', 0, 'https://chatgpt.com', 'The most widely used AI assistant for writing, analysis, coding help, image generation, voice and deep research tasks.', ['Web', 'iOS', 'Android', 'macOS', 'Windows'], ['Chat', 'Reasoning', 'Image Generation', 'Voice', 'Deep Research'], ['assistant', 'chat', 'gpt'], 1],
  ['Claude', 'Anthropic', 'Productivity', 'AI Assistant', 'Freemium', 0, 'https://claude.ai', 'AI assistant known for nuanced writing, long-context analysis (200K+ tokens), Artifacts and Projects for knowledge work.', ['Web', 'iOS', 'Android', 'macOS', 'Windows'], ['Chat', 'Long Context', 'Artifacts', 'Analysis'], ['assistant', 'chat', 'claude'], 1],
  ['Gemini', 'Google DeepMind', 'Productivity', 'AI Assistant', 'Freemium', 0, 'https://gemini.google.com', 'Google\u2019s AI assistant with deep integration into Search, Workspace, Gmail and Android, powered by the Gemini model family.', ['Web', 'iOS', 'Android', 'Workspace'], ['Chat', 'Multimodal', 'Workspace Integration', 'Deep Research'], ['assistant', 'chat', 'google'], 1],
  ['Perplexity', 'Perplexity', 'Research', 'Answer Engine', 'Freemium', 0, 'https://www.perplexity.ai', 'AI-powered answer engine that searches the live web and returns cited, source-linked answers with follow-up conversation.', ['Web', 'iOS', 'Android'], ['Web Search', 'Citations', 'Follow-ups', 'File Analysis'], ['search', 'research', 'citations'], 1],
  ['Elicit', 'Elicit', 'Research', 'Literature Review', 'Freemium', 0, 'https://elicit.com', 'AI research assistant that finds, summarizes and extracts data from academic papers to accelerate systematic literature reviews.', ['Web'], ['Paper Search', 'Summarization', 'Data Extraction', 'Systematic Reviews'], ['research', 'papers', 'academic'], 0],
  ['Consensus', 'Consensus', 'Research', 'Evidence Search', 'Freemium', 0, 'https://consensus.app', 'Search engine that surfaces and synthesizes evidence from peer-reviewed scientific papers, with a Consensus Meter for yes/no questions.', ['Web'], ['Scientific Search', 'Evidence Synthesis', 'Paper Summaries'], ['research', 'science', 'evidence'], 0],
  ['NotebookLM', 'Google DeepMind', 'Education', 'Study Assistant', 'Free', 0, 'https://notebooklm.google.com', 'AI notebook grounded in your own documents; generates study guides, FAQs, timelines and two-host Audio Overviews podcasts.', ['Web', 'iOS', 'Android'], ['Document Grounding', 'Audio Overviews', 'Study Guides', 'Citations'], ['notes', 'study', 'audio'], 1],
  ['Midjourney', 'Midjourney', 'Image Generation', 'Art Generator', 'Paid', 0, 'https://www.midjourney.com', 'Leading artistic image generator known for striking aesthetics, style references, omni-reference control and a Discord + web experience.', ['Web', 'Discord'], ['Text-to-Image', 'Style Reference', 'Upscaling', 'Image Editing'], ['image', 'art', 'generation'], 1],
  ['DALL-E 3', 'OpenAI', 'Image Generation', 'Prompt Image Model', 'Freemium', 0, 'https://openai.com/index/dall-e-3/', 'OpenAI\u2019s image model integrated into ChatGPT and the API, strong at following detailed prompts and rendering legible text.', ['Web', 'API'], ['Text-to-Image', 'Prompt Following', 'Text Rendering'], ['image', 'dalle', 'openai'], 0],
  ['Stable Diffusion', 'Stability AI', 'Image Generation', 'Open Image Model', 'Open Source', 1, 'https://stability.ai/news', 'The seminal open image generation model family (SDXL, SD 3.5) runnable locally, powering a vast ecosystem of fine-tunes and tools.', ['Local', 'API', 'Web'], ['Text-to-Image', 'Img2Img', 'Inpainting', 'Fine-tuning', 'LoRA'], ['image', 'open-source', 'diffusion'], 1],
  ['FLUX', 'Black Forest Labs', 'Image Generation', 'Open Image Model', 'Freemium', 0, 'https://bfl.ai', 'State-of-the-art image model family (FLUX.1 pro/dev/schnell) from Black Forest Labs, known for photorealism, hands and text rendering.', ['API', 'Local', 'Web'], ['Text-to-Image', 'Photorealism', 'Image Editing', 'LoRA Training'], ['image', 'flux', 'open-weights'], 1],
  ['Ideogram', 'Ideogram', 'Image Generation', 'Text-in-Image', 'Freemium', 0, 'https://ideogram.ai', 'Image generator famous for accurate text rendering inside images \u2014 posters, logos, typography \u2014 plus Magic Fill editing.', ['Web', 'API'], ['Text-to-Image', 'Text Rendering', 'Inpainting', 'Style Control'], ['image', 'typography', 'design'], 0],
  ['Leonardo AI', 'Leonardo Interactive', 'Image Generation', 'Creative Suite', 'Freemium', 0, 'https://leonardo.ai', 'Creative image suite with fine-tuned models, real-time canvas generation, motion and character consistency tools for production art.', ['Web', 'iOS', 'API'], ['Text-to-Image', 'Canvas Editor', 'Motion', 'Model Fine-tuning'], ['image', 'creative', 'game-art'], 0],
  ['Adobe Firefly', 'Adobe', 'Image Generation', 'Creative Cloud AI', 'Freemium', 0, 'https://www.adobe.com/products/firefly.html', 'Commercially safe generative AI trained on licensed content, embedded across Photoshop, Illustrator, Express and Premiere.', ['Web', 'Creative Cloud', 'API'], ['Generative Fill', 'Text-to-Image', 'Text Effects', 'Video Generation'], ['image', 'adobe', 'creative-cloud'], 1],
  ['Runway', 'Runway', 'Video Generation', 'AI Film Tools', 'Freemium', 0, 'https://runwayml.com', 'Generative video pioneer (Gen-4) with text-to-video, video-to-video, motion brush, and a full suite of AI film editing tools.', ['Web', 'iOS', 'API'], ['Text-to-Video', 'Video-to-Video', 'Motion Brush', 'Inpainting'], ['video', 'film', 'generation'], 1],
  ['Pika', 'Pika Labs', 'Video Generation', 'Social Video AI', 'Freemium', 0, 'https://pika.art', 'Fun-first AI video generator with effects like Pikaffects, Pikadditions and Pikaswaps for social content creation.', ['Web', 'iOS', 'Discord'], ['Text-to-Video', 'Image-to-Video', 'Video Effects'], ['video', 'social', 'effects'], 0],
  ['Luma Dream Machine', 'Luma AI', 'Video Generation', 'Fast Video Model', 'Freemium', 0, 'https://lumalabs.ai/dream-machine', 'Fast, high-quality video generation model (Ray2) with keyframe control, available on web and API.', ['Web', 'API', 'iOS'], ['Text-to-Video', 'Image-to-Video', 'Keyframes', 'Camera Motion'], ['video', 'luma', 'ray2'], 0],
  ['Sora', 'OpenAI', 'Video Generation', 'Frontier Video Model', 'Paid', 0, 'https://sora.com', 'OpenAI\u2019s frontier text-to-video model generating minute-long, physically plausible scenes, with a social feed and remixing app.', ['Web', 'iOS', 'API'], ['Text-to-Video', 'Storyboard', 'Remix', 'Loop'], ['video', 'sora', 'openai'], 1],
  ['Kling', 'Kuaishou', 'Video Generation', 'Cinematic Video', 'Freemium', 0, 'https://klingai.com', 'Kuaishou\u2019s cinematic video generation model with long durations, strong motion coherence and lip-sync capabilities.', ['Web', 'API'], ['Text-to-Video', 'Image-to-Video', 'Lip Sync', 'Long Video'], ['video', 'kling', 'cinematic'], 0],
  ['Suno', 'Suno', 'Audio', 'Music Generation', 'Freemium', 0, 'https://suno.com', 'Leading AI music generator producing full songs with vocals, lyrics and instrumentation in any genre from a text prompt.', ['Web', 'iOS', 'Android', 'API'], ['Text-to-Music', 'Vocals', 'Lyrics', 'Remix'], ['music', 'audio', 'songs'], 1],
  ['Udio', 'Udio', 'Audio', 'Music Generation', 'Freemium', 0, 'https://www.udio.com', 'High-fidelity AI music generation with fine control over composition, extensions and remixes, favored for audio quality.', ['Web'], ['Text-to-Music', 'Remix', 'Extension', 'High Fidelity'], ['music', 'audio', 'udio'], 0],
  ['ElevenLabs', 'ElevenLabs', 'Audio', 'Voice AI', 'Freemium', 0, 'https://elevenlabs.io', 'The standard for AI voice: ultra-realistic text-to-speech, voice cloning, dubbing and conversational voice agents in 30+ languages.', ['Web', 'API', 'iOS'], ['Text-to-Speech', 'Voice Cloning', 'Dubbing', 'Voice Agents'], ['voice', 'tts', 'audio'], 1],
  ['Whisper', 'OpenAI', 'Audio', 'Speech Recognition', 'Open Source', 1, 'https://github.com/openai/whisper', 'Open-source automatic speech recognition model family with state-of-the-art multilingual transcription and translation.', ['Local', 'API'], ['Transcription', 'Translation', 'Multilingual', 'Timestamps'], ['asr', 'transcription', 'open-source'], 0],
  ['LangChain', 'LangChain', 'Developer Infrastructure', 'Agent Framework', 'Open Source', 1, 'https://www.langchain.com', 'The most popular framework for building LLM applications: chains, agents, tool use, memory, plus LangGraph and LangSmith for production.', ['Python', 'JavaScript'], ['Chains', 'Agents', 'RAG', 'Orchestration', 'Observability'], ['framework', 'llm', 'agents'], 1],
  ['CrewAI', 'CrewAI', 'AI Agents', 'Multi-Agent Framework', 'Open Source', 1, 'https://www.crewai.com', 'Python framework for orchestrating role-playing autonomous AI agents that collaborate as a crew on complex tasks.', ['Python'], ['Multi-Agent', 'Role-based Agents', 'Task Orchestration', 'Tool Use'], ['agents', 'framework', 'python'], 0],
  ['AutoGen', 'Microsoft', 'AI Agents', 'Multi-Agent Framework', 'Open Source', 1, 'https://github.com/microsoft/autogen', 'Microsoft\u2019s framework for programming multi-agent conversational systems, with an event-driven architecture and AutoGen Studio UI.', ['Python', '.NET'], ['Multi-Agent', 'Conversations', 'Code Execution', 'Studio UI'], ['agents', 'framework', 'microsoft'], 0],
  ['Pinecone', 'Pinecone', 'Developer Infrastructure', 'Vector Database', 'Freemium', 0, 'https://www.pinecone.io', 'Managed vector database for similarity search and RAG at scale, with serverless pricing and hybrid dense-sparse retrieval.', ['Cloud', 'API'], ['Vector Search', 'RAG', 'Namespaces', 'Hybrid Search'], ['vector-db', 'rag', 'embeddings'], 1],
  ['Weaviate', 'Weaviate', 'Developer Infrastructure', 'Vector Database', 'Open Source', 1, 'https://weaviate.io', 'Open-source vector database with hybrid search, built-in vectorization modules and GraphQL-style queries.', ['Self-hosted', 'Cloud'], ['Vector Search', 'Hybrid Search', 'Modules', 'GraphQL'], ['vector-db', 'open-source', 'rag'], 0],
  ['Together AI', 'Together AI', 'Developer Infrastructure', 'Inference Cloud', 'Freemium', 0, 'https://www.together.ai', 'Cloud platform for running and fine-tuning open models (Llama, DeepSeek, Qwen) with fast, low-cost inference APIs.', ['Cloud', 'API'], ['Inference', 'Fine-tuning', 'Open Models', 'GPU Clusters'], ['inference', 'cloud', 'open-models'], 0],
  ['Groq', 'Groq', 'Developer Infrastructure', 'Fast Inference', 'Freemium', 0, 'https://groq.com', 'LPU-based inference cloud delivering some of the fastest token generation speeds available for open LLMs.', ['Cloud', 'API'], ['Fast Inference', 'Open Models', 'Batch API'], ['inference', 'lpu', 'speed'], 0],
  ['Ollama', 'Ollama', 'Developer Infrastructure', 'Local LLM Runner', 'Open Source', 1, 'https://ollama.com', 'Run Llama, DeepSeek, Qwen, Mistral and other open models locally on macOS, Linux and Windows with a single command.', ['macOS', 'Linux', 'Windows', 'Docker'], ['Local LLMs', 'Model Management', 'API Server', 'Modelfiles'], ['local', 'llm', 'open-source'], 1],
  ['Hugging Face Hub', 'Hugging Face', 'Developer Infrastructure', 'ML Platform', 'Freemium', 1, 'https://huggingface.co', 'The central platform for open ML: host and share models, datasets and demos (Spaces) with Transformers and Diffusers libraries.', ['Web', 'Python', 'API'], ['Model Hosting', 'Datasets', 'Spaces', 'Inference Endpoints'], ['hub', 'open-source', 'models'], 1],
  ['Figma AI', 'Figma', 'Design', 'Design Assistant', 'Freemium', 0, 'https://www.figma.com/ai/', 'AI features across Figma: First Draft layout generation, visual search, auto-rename layers, and Make Designs prototyping.', ['Web', 'macOS', 'Windows'], ['Layout Generation', 'Visual Search', 'Prototyping', 'Auto-naming'], ['design', 'figma', 'ui'], 0],
  ['Grammarly', 'Grammarly', 'Writing', 'Writing Assistant', 'Freemium', 0, 'https://www.grammarly.com', 'Writing assistant covering grammar, clarity, tone and plagiarism detection, now with generative AI composition (Grammarly AI).', ['Web', 'Windows', 'macOS', 'iOS', 'Android', 'Browser Extension'], ['Grammar Check', 'Tone Detection', 'Rewrites', 'Plagiarism Check'], ['writing', 'grammar', 'assistant'], 0],
  ['Jasper', 'Jasper', 'Marketing', 'Marketing Copy', 'Paid', 0, 'https://www.jasper.ai', 'AI content platform for marketing teams: brand voice, campaigns, blog posts and ad copy at scale with team workflows.', ['Web', 'Browser Extension', 'API'], ['Brand Voice', 'Campaigns', 'Blog Generation', 'Ad Copy'], ['marketing', 'copywriting', 'content'], 0],
  ['Synthesia', 'Synthesia', 'Business', 'AI Video Platform', 'Paid', 0, 'https://www.synthesia.io', 'Enterprise AI video generator with 230+ realistic avatars and 140+ languages for training, onboarding and corporate comms.', ['Web'], ['Avatar Videos', 'Text-to-Video', 'Multilingual', 'Templates'], ['video', 'avatars', 'enterprise'], 0],
  ['HeyGen', 'HeyGen', 'Marketing', 'AI Video Avatars', 'Freemium', 0, 'https://www.heygen.com', 'Create spokesperson videos with AI avatars, translate videos with lip-sync dubbing, and generate personalized videos via API.', ['Web', 'API'], ['Avatar Videos', 'Video Translation', 'Lip Sync', 'Personalization'], ['video', 'avatars', 'marketing'], 0],
  ['Meshy', 'Meshy', '3D & Spatial', '3D Generation', 'Freemium', 0, 'https://www.meshy.ai', 'AI 3D generation from text or images: produces textured meshes ready for games, AR/VR and 3D printing pipelines.', ['Web', 'API'], ['Text-to-3D', 'Image-to-3D', 'Texturing', 'Rigging'], ['3d', 'mesh', 'generation'], 0]
];

// models: [name, developer, model_type, release_date, context_length, modalities, open_source, api_available, pricing_notes, benchmark_notes, official_url, description]
const MODELS = [
  ['GPT-4o', 'OpenAI', 'Multimodal', '2024-05-13', 128000, ['text', 'image', 'audio'], 0, 1, 'API: ~$2.50/M input tokens; free tier in ChatGPT', 'Flagship multimodal model at launch; strong on MMLU, HumanEval and vision tasks', 'https://openai.com/index/hello-gpt-4o/', 'OpenAI\u2019s omni-modal flagship handling text, audio and vision natively with fast responses in ChatGPT and the API.'],
  ['GPT-4.1', 'OpenAI', 'Multimodal', '2025-04-14', 1000000, ['text', 'image'], 0, 1, 'API: $2/M input, $8/M output tokens', '~21% improvement over GPT-4o on SWE-bench Verified; 1M token context', 'https://openai.com/index/gpt-4-1/', 'Developer-focused upgrade with a 1M-token context window and stronger instruction following for agentic coding.'],
  ['o3', 'OpenAI', 'LLM', '2025-04-16', 200000, ['text', 'image'], 0, 1, 'API: $10/M input tokens (o3); o4-mini cheaper', '88% on SWE-bench Verified with tools; state-of-the-art reasoning at launch', 'https://openai.com/index/introducing-o3-and-o4-mini/', 'OpenAI\u2019s deep-reasoning model that thinks with tools \u2014 search, code and image analysis \u2014 before answering.'],
  ['Claude 3.7 Sonnet', 'Anthropic', 'LLM', '2025-02-24', 200000, ['text', 'image'], 0, 1, 'API: $3/M input, $15/M output tokens', 'Frontier hybrid reasoning model; strong coding (SWE-bench ~70%)', 'https://www.anthropic.com/news/claude-3-7-sonnet', 'First hybrid reasoning model: instant responses or extended step-by-step thinking in a single model, best-in-class coding at release.'],
  ['Claude Sonnet 4', 'Anthropic', 'LLM', '2025-05-22', 200000, ['text', 'image'], 0, 1, 'API: $3/M input, $15/M output tokens', '72.7% SWE-bench Verified; 4-hour sustained agentic work', 'https://www.anthropic.com/news/claude-4', 'Workhorse model for sustained agents and enterprise coding, balancing speed, cost and near-Opus capability.'],
  ['Claude Opus 4.1', 'Anthropic', 'LLM', '2025-08-05', 200000, ['text', 'image'], 0, 1, 'API: $15/M input, $75/M output tokens', '74.5% SWE-bench Verified \u2014 top coding benchmark score at release', 'https://www.anthropic.com/news/claude-opus-4-1', 'Anthropic\u2019s most capable model for long-horizon agentic coding, deep research and complex analysis.'],
  ['Gemini 2.5 Pro', 'Google DeepMind', 'Multimodal', '2025-03-25', 1000000, ['text', 'image', 'audio', 'video'], 0, 1, 'API: $1.25/M input tokens; Google AI Ultra subscription', '#1 on LMArena at launch; strong multimodal reasoning with Deep Think mode', 'https://deepmind.google/models/gemini/pro/', 'Google\u2019s thinking model with 1M-token context, native multimodality and optional Deep Think parallel reasoning.'],
  ['Gemini 2.5 Flash', 'Google DeepMind', 'Multimodal', '2025-06-17', 1000000, ['text', 'image', 'audio', 'video'], 0, 1, 'API: ~$0.30/M input tokens', 'Best price/performance in its class; thinking budget control', 'https://deepmind.google/models/gemini/flash/', 'Fast, cheap multimodal model with configurable thinking budgets for high-volume production workloads.'],
  ['Llama 4 Maverick', 'Meta AI', 'Multimodal', '2025-04-05', 1000000, ['text', 'image'], 1, 1, 'Open weights (community license); free to self-host', 'Competitive with GPT-4o on many benchmarks at launch; 16-expert MoE', 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/', 'Meta\u2019s open-weights MoE multimodal model: 17B active of 400B params, 1M-token context, best-in-class among open models.'],
  ['Llama 4 Scout', 'Meta AI', 'Multimodal', '2025-04-05', 10000000, ['text', 'image'], 1, 1, 'Open weights (community license)', '10M-token context \u2014 industry longest; strong efficiency on single H100', 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/', 'Efficient open MoE model (17B active) with a record 10M-token context window, runnable on one GPU.'],
  ['DeepSeek-V3', 'DeepSeek', 'LLM', '2024-12-26', 128000, ['text'], 1, 1, 'Open weights (MIT); trained for ~$5.6M reported', 'Matched GPT-4o-class performance at a fraction of training cost; 671B MoE', 'https://github.com/deepseek-ai/DeepSeek-V3', '671B-parameter MoE model that shocked the industry by matching frontier closed models at dramatically lower training cost.'],
  ['DeepSeek-R1', 'DeepSeek', 'LLM', '2025-01-20', 128000, ['text'], 1, 1, 'Open weights (MIT)', 'OpenAI o1-0120-competitive on AIME, MATH and coding benchmarks', 'https://github.com/deepseek-ai/DeepSeek-R1', 'Open reasoning model trained with large-scale RL; its chain-of-thought distillation into smaller models reshaped the industry.'],
  ['Mistral Large 2', 'Mistral AI', 'LLM', '2024-07-24', 128000, ['text'], 0, 1, 'API pricing; weights available for research', 'Comparable to GPT-4o on MMLU (~84%); strong multilingual + code', 'https://mistral.ai/news/mistral-large-2407', 'Mistral\u2019s 123B flagship with native function calling, 80+ programming languages and top-tier multilingual performance.'],
  ['Grok 3', 'xAI', 'Multimodal', '2025-02-17', 131072, ['text', 'image'], 0, 1, 'X Premium+/SuperGrok subscription; API access', 'Top scores on AIME, GPQA among models available at launch; Think mode', 'https://x.ai/news/grok-3', 'xAI\u2019s frontier model trained on the 200K-GPU Colossus cluster, with Think and DeepSearch reasoning modes.'],
  ['FLUX.1 [dev]', 'Black Forest Labs', 'Image', '2024-08-01', null, ['text', 'image'], 1, 1, 'Open weights (non-commercial); pro via API', 'State-of-the-art open image model at release; beat SD3 on human preference', 'https://bfl.ai', '12B rectified-flow transformer for text-to-image with exceptional prompt following, photorealism and text rendering.'],
  ['Stable Diffusion 3.5 Large', 'Stability AI', 'Image', '2024-10-22', null, ['text', 'image'], 1, 1, 'Open weights (community license)', 'Top open image model at release; 8B MMDiT architecture', 'https://stability.ai/news/stable-diffusion-3-5', 'Open 8B multimodal diffusion transformer with improved text rendering, diverse styles and local runnability.'],
  ['Sora', 'OpenAI', 'Video', '2024-12-09', null, ['text', 'image', 'video'], 0, 1, 'ChatGPT Plus/Pro tiers; API access rolling out', 'Minute-long coherent video generation; strong physics and camera control', 'https://openai.com/sora/', 'OpenAI\u2019s text-to-video diffusion transformer generating high-fidelity, physically plausible videos up to a minute.'],
  ['Whisper large-v3', 'OpenAI', 'Audio', '2023-11-06', null, ['audio', 'text'], 1, 1, 'Open source (MIT); API per-minute pricing', 'State-of-the-art multilingual ASR across 100+ languages at release', 'https://github.com/openai/whisper', 'The largest Whisper model: 1.55B params, trained on 5M hours of audio for robust multilingual transcription and translation.'],
  ['text-embedding-3-large', 'OpenAI', 'Embedding', '2024-01-25', 8191, ['text'], 0, 1, 'API: $0.13/M tokens', '80.9% MTEB at release; supports dimension truncation (Matryoshka)', 'https://openai.com/index/new-embedding-models-and-api-updates/', 'OpenAI\u2019s most capable embedding model with 3072 dimensions (truncatable) for search, clustering and RAG.'],
  ['Gemini 2.0 Flash', 'Google DeepMind', 'Multimodal', '2024-12-11', 1000000, ['text', 'image', 'audio', 'video'], 0, 1, 'API and Google AI Studio; low cost', 'Agentic-era model: native tool use, streaming audio/video output', 'https://deepmind.google/models/gemini/flash/', 'First model of the agentic era for Google: native function calling, multimodal live streaming and Project Astra integration.']
];

const PAPERS = [
  { arxiv_id: '1706.03762', title: 'Attention Is All You Need', authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Lukasz Kaiser', 'Illia Polosukhin'], abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments show these models achieve state-of-the-art results on machine translation while being more parallelizable and requiring significantly less time to train.', published_at: '2017-06-12', primary_category: 'cs.CL', tags: ['transformer', 'attention', 'architecture'], company_slug: 'google-deepmind' },
  { arxiv_id: '2201.11903', title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models', authors: ['Jason Wei', 'Xuezhi Wang', 'Dale Schuurmans', 'Maarten Bosma', 'Brian Ichter', 'Fei Xia', 'Ed Chi', 'Quoc Le', 'Denny Zhou'], abstract: 'We explore how generating a chain of thought \u2014 a series of intermediate natural language reasoning steps that lead to a final output \u2014 improves the ability of large language models to perform complex reasoning.', published_at: '2022-01-28', primary_category: 'cs.CL', tags: ['reasoning', 'prompting', 'chain-of-thought'], company_slug: 'google-deepmind' },
  { arxiv_id: '2212.08073', title: 'Constitutional AI: Harmlessness from AI Feedback', authors: ['Yuntao Bai', 'Saurav Kadavath', 'Sandipan Kundu', 'Amanda Askell', 'Jackson Kernion', 'Andy Jones', 'Anna Chen', 'Anna Goldie', 'et al.'], abstract: 'We experiment with methods for training a harmless AI assistant through self-improvement, without any human labels identifying harmful outputs. The method involves both a supervised learning phase, where AI feedback generates training data, and a reinforcement learning phase where we sample from models trained on that data and use AI feedback for reward modeling (RLAIF).', published_at: '2022-12-15', primary_category: 'cs.CL', tags: ['safety', 'alignment', 'rlhf'], company_slug: 'anthropic' },
  { arxiv_id: '2106.09685', title: 'LoRA: Low-Rank Adaptation of Large Language Models', authors: ['Edward J. Hu', 'Yelong Shen', 'Phillip Wallis', 'Zeyuan Allen-Zhu', 'Yizhen Li', 'Shean Wang', 'Lu Wang', 'Weizhu Chen'], abstract: 'We propose Low-Rank Adaptation (LoRA), which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks.', published_at: '2021-06-17', primary_category: 'cs.CL', tags: ['fine-tuning', 'efficiency', 'lora'], company_slug: 'microsoft' },
  { arxiv_id: '2005.11401', title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', authors: ['Patrick Lewis', 'Ethan Perez', 'Aleksandra Piktus', 'Fabio Petroni', 'Vladimir Karpukhin', 'Naman Goyal', 'Heinrich Kuttler', 'Mike Lewis', 'Wen-tau Yih', 'Tim Rocktaschel', 'Sebastian Riedel', 'Douwe Kiela'], abstract: 'We introduce RAG \u2014 models which combine pre-trained parametric and non-parametric memory for language generation. RAG models achieve state-of-the-art results on open-domain QA benchmarks and generate more specific, factual and contextual language than parametric-only models.', published_at: '2020-05-22', primary_category: 'cs.CL', tags: ['rag', 'retrieval', 'generation'], company_slug: 'meta-ai' },
  { arxiv_id: '2303.08774', title: 'GPT-4 Technical Report', authors: ['OpenAI'], abstract: 'We report the development of GPT-4, a large-scale multimodal model which can accept image and text inputs and produce text outputs. GPT-4 exhibits human-level performance on various professional and academic benchmarks, including passing a simulated bar exam with a score around the top 10% of test takers.', published_at: '2023-03-15', primary_category: 'cs.CL', tags: ['gpt-4', 'multimodal', 'benchmarks'], company_slug: 'openai' },
  { arxiv_id: '2304.02643', title: 'Segment Anything', authors: ['Alexander Kirillov', 'Eric Mintun', 'Nikhila Ravi', 'Hanzi Mao', 'Chloe Rolland', 'Laura Gustafson', 'Tete Xiao', 'Spencer Whitehead', 'Alex Berg', 'Wan-Yen Lo', 'Piotr Dollar', 'Ross Girshick'], abstract: 'We introduce the Segment Anything (SA) project: a new task, model, and dataset for image segmentation. We built the largest segmentation dataset to date (by over 44x), with 1B masks on 11M licensed and privacy-respecting images (SA-1B).', published_at: '2023-04-05', primary_category: 'cs.CV', tags: ['segmentation', 'computer-vision', 'sam'], company_slug: 'meta-ai' },
  { arxiv_id: '2212.04356', title: 'Robust Speech Recognition via Large-Scale Weak Supervision', authors: ['Alec Radford', 'Jong Wook Kim', 'Tao Xu', 'Greg Brockman', 'Christine McLeavey', 'Ilya Sutskever'], abstract: 'We study the capabilities of speech processing systems trained simply to predict large amounts of transcripts of audio on the internet. Our best model, Whisper, approaches human-level robustness and accuracy on standard benchmarks with near-zero-shot performance across diverse datasets.', published_at: '2022-12-06', primary_category: 'eess.AS', tags: ['speech', 'whisper', 'asr'], company_slug: 'openai' },
  { arxiv_id: '2305.18290', title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model', authors: ['Rafael Rafailov', 'Archit Sharma', 'Eric Mitchell', 'Stefano Ermon', 'Christopher D. Manning', 'Chelsea Finn'], abstract: 'We introduce a new parameterization of the reward model in RLHF that enables extraction of the corresponding optimal policy in closed form, thereby eliminating the need for a separate reinforcement learning stage. This DPO algorithm is stable, performant, and computationally lightweight.', published_at: '2023-05-29', primary_category: 'cs.LG', tags: ['alignment', 'rlhf', 'dpo'], company_slug: null },
  { arxiv_id: '2312.00752', title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces', authors: ['Albert Gu', 'Tri Dao'], abstract: 'We introduce a new class of efficient sequence models, selective state space models (Mamba), which achieve strong performance on language modeling while enjoying linear-time inference. Mamba achieves state-of-the-art performance across several modalities such as language, audio, and genomics.', published_at: '2023-12-01', primary_category: 'cs.LG', tags: ['architecture', 'ssm', 'efficiency'], company_slug: null },
  { arxiv_id: '2403.05530', title: 'Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context', authors: ['Gemini Team, Google'], abstract: 'We report the development of Gemini 1.5 Pro, a Mixture-of-Experts multimodal model that achieves near-perfect recall on long-context retrieval tasks across modalities, improving over its predecessor with standard benchmarks while handling up to 10M tokens of context.', published_at: '2024-03-08', primary_category: 'cs.CL', tags: ['gemini', 'long-context', 'multimodal'], company_slug: 'google-deepmind' },
  { arxiv_id: '2407.21783', title: 'The Llama 3 Herd of Models', authors: ['Abhimanyu Dubey', 'Abhinav Jauhri', 'Abhinav Pandey', 'Aditya Kadian', 'Ahmad Al-Dahle', 'Aiesha Letman', 'et al.'], abstract: 'Modern artificial intelligence (AI) systems are powered by foundation models. This paper presents a new set of foundation models, called Llama 3, a herd of language models including 8B and 70B parameter variants supporting up to 128K context tokens, and later multimodal multilingual models up to 405B parameters.', published_at: '2024-07-31', primary_category: 'cs.CL', tags: ['llama', 'open-weights', 'llm'], company_slug: 'meta-ai' },
  { arxiv_id: '2501.12948', title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning', authors: ['DeepSeek-AI'], abstract: 'We introduce DeepSeek-R1-Zero and DeepSeek-R1, which incorporate reinforcement learning (RL) without supervised fine-tuning (SFT) as a preliminary step. DeepSeek-R1 achieves performance comparable to OpenAI-o1-0122 and its open-source ecosystem yields surprising benefits such as emergence of long chain-of-thought reasoning.', published_at: '2025-01-22', primary_category: 'cs.CL', tags: ['reasoning', 'reinforcement-learning', 'deepseek'], company_slug: 'deepseek' },
  { arxiv_id: '2303.12712', title: 'Sparks of Artificial General Intelligence: Early experiments with GPT-4', authors: ['Sebastien Bubeck', 'Varun Chandrasekaran', 'Ron Eldan', 'Johannes Gehrke', 'Eric Horvitz', 'Ece Kamar', 'Peter Lee', 'Yin Tat Lee', 'Yuanzhi Li', 'Scott Lundberg', 'Harsha Nori', 'Hamid Palangi', 'Marco Tulio Ribeiro', 'Yi Zhang'], abstract: 'In this paper we explore a series of experiments across psychology, computer vision, law, medicine and more with GPT-4. We argue that GPT-4 demonstrates sparks of artificial general intelligence (AGI) in terms of breadth and depth of capabilities.', published_at: '2023-03-22', primary_category: 'cs.AI', tags: ['gpt-4', 'agi', 'evaluation'], company_slug: 'microsoft' },
  { arxiv_id: '2412.15115', title: 'Qwen2.5 Technical Report', authors: ['Qwen Team, Alibaba'], abstract: 'We present Qwen2.5, the latest flagship series of Qwen large language and multimodal models, including causal language models ranging from 0.5B to 72B parameters covering Base and Instruct variants, with improvements in pre-training and post-training datasets and techniques.', published_at: '2024-12-19', primary_category: 'cs.CL', tags: ['qwen', 'open-weights', 'llm'], company_slug: null }
];

// Seed news: realistic recent headlines (is_seed=1), within ~2 weeks of 2026-09-26.
const SEED_NEWS = [
  { title: 'OpenAI ships GPT-5 with unified reasoning and real-time tool use', source: 'OpenAI News', url: 'https://openai.com/index/introducing-gpt-5/', category: 'AI Models', importance: 5, published_at: '2026-09-24T17:00:00Z', author: 'OpenAI', summary: 'OpenAI announced GPT-5, its new flagship model that automatically routes between fast responses and deep reasoning. The model integrates real-time tool use, including web search and code execution, across ChatGPT and the API.', takeaways: ['GPT-5 unifies fast and deep reasoning in one model', 'Real-time tool use is built into the base model', 'Available in ChatGPT and the API from launch'], why: 'A unified reasoning model with native tools sets a new baseline for what assistant products can reliably do.', tags: ['gpt-5', 'openai', 'reasoning'], image_url: null },
  { title: 'Google DeepMind releases Gemini 3.0 with agentic browsing and 2M-token context', source: 'Google DeepMind Blog', url: 'https://deepmind.google/blog/gemini-3-0/', category: 'AI Models', importance: 5, published_at: '2026-09-22T15:30:00Z', author: 'Google DeepMind', summary: 'Google DeepMind introduced Gemini 3.0, a new frontier model family with agentic browsing capabilities and a 2M-token context window. Deep Think mode is now available to more tiers of Google AI subscribers.', takeaways: ['Gemini 3.0 adds native agentic browsing', 'Context window expands to 2M tokens', 'Deep Think reasoning rolls out more broadly'], why: 'Frontier competition is shifting from raw benchmarks to models that can act across the web on a user\u2019s behalf.', tags: ['gemini', 'google', 'agents'], image_url: null },
  { title: 'Anthropic raises $3B Series F at a $90B valuation', source: 'TechCrunch AI', url: 'https://techcrunch.com/2026/09/23/anthropic-raises-3b-series-f/', category: 'AI Startups', importance: 4, published_at: '2026-09-23T13:00:00Z', author: 'Marina Temkin', summary: 'Anthropic has closed a $3 billion Series F round valuing the Claude maker at roughly $90 billion. The company says the funds will go toward compute capacity and enterprise go-to-market expansion.', takeaways: ['Anthropic raised $3B in a Series F', 'Valuation reached approximately $90B', 'Proceeds target compute and enterprise expansion'], why: 'The round underscores how capital continues to concentrate in the small group of frontier model builders.', tags: ['anthropic', 'funding', 'claude'], image_url: null },
  { title: 'Claude Opus 4.5 tops SWE-bench Verified at 78%, Anthropic claims', source: 'The Decoder', url: 'https://the-decoder.com/claude-opus-4-5-tops-swe-bench/', category: 'AI Coding', importance: 4, published_at: '2026-09-18T09:15:00Z', author: 'Markus Kasanmascheff', summary: 'Anthropic\u2019s newest Opus release scored a reported 78% on SWE-bench Verified, the strongest public result on the agentic coding benchmark. The model also extends sustained autonomous work sessions beyond six hours.', takeaways: ['Claude Opus 4.5 scores 78% on SWE-bench Verified', 'Sustained agent sessions extended past 6 hours', 'Anthropic positions the model for enterprise engineering'], why: 'Coding benchmarks are now the primary battleground for frontier model competition and enterprise adoption.', tags: ['claude', 'coding', 'benchmarks'], image_url: null },
  { title: 'NVIDIA unveils next-gen Rubin GPUs at GTC, promising 3x inference throughput', source: 'NVIDIA Blog', url: 'https://blogs.nvidia.com/blog/rubin-gpu-announcement/', category: 'AI Hardware', importance: 4, published_at: '2026-09-20T16:00:00Z', author: 'NVIDIA Newsroom', summary: 'NVIDIA detailed its Rubin GPU platform at GTC, claiming a 3x improvement in inference throughput per rack versus Blackwell. Major cloud providers have already committed to Rubin-based data centers for 2027.', takeaways: ['Rubin platform claims 3x inference throughput per rack', 'Cloud providers commit to 2027 deployments', 'NVLink and memory bandwidth receive major upgrades'], why: 'Inference economics at data-center scale will determine the price of every AI product consumers use.', tags: ['nvidia', 'gpu', 'hardware'], image_url: null },
  { title: 'EU AI Act enforcement begins: GPAI obligations now carry fines', source: 'Ars Technica AI', url: 'https://arstechnica.com/ai/2026/09/eu-ai-act-gpai-enforcement/', category: 'AI Regulation', importance: 4, published_at: '2026-09-15T11:00:00Z', author: 'Ashley Belanger', summary: 'Enforcement of the EU AI Act\u2019s general-purpose AI obligations has begun, with fines of up to 3% of global turnover for non-compliance. Providers of frontier models must now publish training-data summaries and pass systemic-risk assessments.', takeaways: ['GPAI obligations are now enforceable with fines up to 3% of global turnover', 'Training-data summaries become mandatory', 'Systemic-risk models face additional assessment duties'], why: 'This is the first real teeth behind major AI legislation, and it will shape how frontier labs operate worldwide.', tags: ['regulation', 'eu', 'compliance'], image_url: null },
  { title: 'Cursor crosses $1B ARR as agentic coding goes mainstream', source: 'VentureBeat AI', url: 'https://venturebeat.com/ai/cursor-1b-arr/', category: 'AI Coding', importance: 4, published_at: '2026-09-16T14:20:00Z', author: 'Michael Nu\u00f1ez', summary: 'Anysphere\u2019s Cursor editor has passed $1 billion in annual recurring revenue, driven by its Composer agent mode. The milestone makes Cursor one of the fastest-growing software products in history.', takeaways: ['Cursor passed $1B ARR', 'Agent mode (Composer) drove most of the growth', 'Enterprise seats grew faster than individual plans'], why: 'Agentic coding tools are now a billion-dollar category, accelerating pressure on traditional IDE vendors.', tags: ['cursor', 'coding', 'arr'], image_url: null },
  { title: 'DeepSeek-V4 technical report describes training a frontier MoE for under $10M', source: 'MarkTechPost', url: 'https://www.marktechpost.com/2026/09/deepseek-v4-technical-report/', category: 'AI Research', importance: 4, published_at: '2026-09-25T07:45:00Z', author: 'Nikhil', summary: 'DeepSeek published the V4 technical report detailing new sparse-attention and FP4 training techniques that keep frontier-scale MoE training under $10M. Weights are released openly under the MIT license.', takeaways: ['DeepSeek-V4 uses sparse attention and FP4 training', 'Frontier-scale training cost reported under $10M', 'Weights released under MIT license'], why: 'Continued cost collapse at the frontier changes who can compete in building top-tier models.', tags: ['deepseek', 'open-source', 'efficiency'], image_url: null },
  { title: 'Meta launches Llama 5 Scout with 32M-token context under a permissive license', source: 'Meta AI Blog', url: 'https://ai.meta.com/blog/llama-5-scout/', category: 'Open Source', importance: 4, published_at: '2026-09-13T10:00:00Z', author: 'Meta AI', summary: 'Meta released Llama 5 Scout, an open-weights mixture-of-experts model with a 32M-token context window under a permissive license. Early evaluations place it ahead of prior open models on long-context retrieval.', takeaways: ['Llama 5 Scout ships open weights with 32M-token context', 'Permissive license allows broad commercial use', 'Leads open models on long-context retrieval'], why: 'Open-weights models matching frontier context lengths narrow the gap with closed labs and expand what developers can self-host.', tags: ['llama', 'meta', 'open-source'], image_url: null },
  { title: 'Sora 2 adds synchronized dialogue and cameos; OpenAI opens creator monetization', source: 'The Verge AI', url: 'https://www.theverge.com/ai/2026/sora-2-dialogue-monetization', category: 'Generative AI', importance: 3, published_at: '2026-09-19T18:30:00Z', author: 'Alex Heath', summary: 'OpenAI\u2019s Sora 2 update adds synchronized dialogue generation and a cameos system for consistent characters across clips. A new creator program shares revenue on top-performing videos in the Sora feed.', takeaways: ['Sora 2 generates synchronized dialogue', 'Cameos keep characters consistent across clips', 'Creator monetization launches in the Sora feed'], why: 'Revenue sharing could pull professional creators into AI video platforms and reshape short-form content economics.', tags: ['sora', 'video', 'generative-ai'], image_url: null },
  { title: 'Devin maker Cognition acquires agent-eval startup for $400M', source: 'TechCrunch AI', url: 'https://techcrunch.com/2026/09/17/cognition-acquires-agent-eval/', category: 'AI Business', importance: 3, published_at: '2026-09-17T12:00:00Z', author: 'Marina Temkin', summary: 'Cognition has acquired an agent-evaluation startup for a reported $400 million to strengthen Devin\u2019s reliability testing. The team will focus on benchmarking long-horizon autonomous tasks in production environments.', takeaways: ['Cognition acquired an agent-eval startup for ~$400M', 'Focus: reliability testing for Devin', 'Long-horizon task benchmarking comes to production'], why: 'Evaluation infrastructure is becoming the differentiator as companies deploy autonomous agents in real workflows.', tags: ['cognition', 'devin', 'acquisition'], image_url: null },
  { title: 'ElevenLabs Agents platform passes 10M monthly voice conversations', source: 'Simon Willison\u2019s Weblog', url: 'https://simonwillison.net/2026/Sep/21/elevenlabs-agents/', category: 'AI Agents', importance: 3, published_at: '2026-09-21T08:00:00Z', author: 'Simon Willison', summary: 'ElevenLabs reports its Agents platform now handles more than 10 million voice conversations per month, spanning customer support and outbound sales. The company credits sub-300ms latency for the adoption curve.', takeaways: ['ElevenLabs Agents passed 10M monthly conversations', 'Support and outbound sales are the top use cases', 'Sub-300ms latency drove enterprise adoption'], why: 'Voice agents at this scale show conversational AI moving decisively beyond text into phone-grade interactions.', tags: ['elevenlabs', 'voice', 'agents'], image_url: null },
  { title: 'New interpretability method localizes deception in frontier models', source: 'MIT News \u2014 AI', url: 'https://news.mit.edu/2026/interpretability-deception-localization', category: 'AI Safety', importance: 4, published_at: '2026-09-14T13:45:00Z', author: 'Adam Zewe', summary: 'MIT researchers demonstrated a sparse-autoencoder technique that localizes internal features correlated with deceptive outputs in frontier-scale models. The work improves the reliability of monitoring evaluations for alignment teams.', takeaways: ['SAE features correlate with deceptive behavior in frontier models', 'Method scales to production-size transformers', 'Monitoring evals become more reliable'], why: 'Being able to see where deception emerges inside a model is a concrete step toward verifiable AI safety.', tags: ['safety', 'interpretability', 'research'], image_url: null },
  { title: 'Figure 03 humanoid begins warehouse deployment pilot with FedEx', source: 'MIT Technology Review', url: 'https://www.technologyreview.com/2026/09/22/figure-03-fedex-pilot/', category: 'Robotics', importance: 3, published_at: '2026-09-22T11:30:00Z', author: 'Charlotte Jee', summary: 'Figure\u2019s third-generation humanoid robot started a paid pilot moving parcels in a FedEx sorting facility. The robot runs a vision-language-action model fine-tuned on warehouse logistics data.', takeaways: ['Figure 03 began a paid pilot at a FedEx facility', 'A vision-language-action model drives the robot', 'Logistics is the first scaled commercial use case'], why: 'Paid humanoid deployments in logistics mark the transition of embodied AI from demos to revenue.', tags: ['robotics', 'humanoid', 'logistics'], image_url: null },
  { title: 'Segment Anything 3 adds open-vocabulary video tracking', source: 'Hugging Face Blog', url: 'https://huggingface.co/blog/sam3-release', category: 'Computer Vision', importance: 3, published_at: '2026-09-12T09:00:00Z', author: 'Meta FAIR', summary: 'Meta FAIR released Segment Anything 3 with open-vocabulary video object tracking, allowing prompts like "the person in the red jacket" to be tracked across frames. Weights and code are published on Hugging Face.', takeaways: ['SAM 3 supports open-vocabulary prompts', 'Video object tracking works across frames', 'Weights and code are publicly available'], why: 'Open-vocabulary video segmentation unlocks annotation-free pipelines for surveillance analytics, sports and editing tools.', tags: ['computer-vision', 'sam', 'open-source'], image_url: null }
];

// Student & education offers.
// TRUST RULES (spec §37/§42/§51): only real, well-documented programs are seeded.
// Benefits are stated conservatively — we NEVER invent a discount %, price or credit
// figure that isn't officially published (uncertain ones are left null and described
// qualitatively). `last_verified_at` starts NULL: nothing is shown as "confirmed active"
// until the verification job actually reaches the official page. status 'verification'
// (Verification Required) is the honest default for newer/institution-dependent offers.
const STUDENT_OFFERS = [
  {
    title: 'GitHub Student Developer Pack',
    company_name: 'GitHub', logo_domain: 'github.com',
    student_benefit: 'Free GitHub Pro + dozens of partner dev tools & credits',
    description: 'The GitHub Student Developer Pack bundles free access to professional developer tools, cloud credits and services for verified students while they remain enrolled.',
    offer_type: 'Student Program', category: 'Coding',
    student_price: 'Free', free_credits: 'Partner credits vary per offer (cloud, domains, tools)',
    eligibility: 'Students 13+ enrolled at a degree-granting institution',
    verification_method: 'GitHub Education verification (school email or academic info)',
    how_to_claim: ['Visit the official GitHub Education page', 'Sign in or create a GitHub account', 'Submit student verification', 'Once approved, open the Pack', 'Redeem each partner offer from its listing'],
    important_conditions: 'Access lasts while you are a verified student; each partner offer has its own terms and may change.',
    official_url: 'https://education.github.com/pack',
    status: 'ongoing', featured: 1, tags: ['github', 'developer', 'credits', 'tools']
  },
  {
    title: 'JetBrains Free Education License',
    company_name: 'JetBrains', logo_domain: 'jetbrains.com',
    student_benefit: 'Free access to all JetBrains IDEs for students & teachers',
    description: 'JetBrains provides free educational licenses for its full IDE family (IntelliJ IDEA, PyCharm, WebStorm, CLion, DataGrip and more) to verified students and faculty.',
    offer_type: 'Education Plan', category: 'Coding',
    student_price: 'Free',
    eligibility: 'Students and faculty at accredited educational institutions',
    verification_method: 'University email, ISIC card or official enrollment documents',
    how_to_claim: ['Visit the JetBrains Education page', 'Apply with your academic details', 'Verify via university email or documents', 'Receive your license key', 'Activate it in any JetBrains IDE'],
    important_conditions: 'Educational licenses are renewed periodically (typically yearly) while you stay eligible; not licensed for commercial use.',
    official_url: 'https://www.jetbrains.com/community/education/',
    status: 'ongoing', featured: 1, tags: ['jetbrains', 'ide', 'coding', 'education']
  },
  {
    title: 'Cursor for Students',
    company_name: 'Anysphere', tool_name: 'Cursor', logo_domain: 'cursor.com',
    student_benefit: 'Free Cursor Pro for verified university students',
    description: 'Cursor offers its Pro plan free to verified university students through its education program, unlocking the full AI code editor and agent features.',
    offer_type: 'Free for Students', category: 'Coding',
    student_price: 'Free (Pro)',
    eligibility: 'Verified university students',
    verification_method: 'Student verification (e.g. SheerID or university email)',
    how_to_claim: ['Visit the Cursor student page', 'Sign in to your Cursor account', 'Complete student verification', 'Pro is applied to your account', 'Confirm Pro features are enabled'],
    important_conditions: 'Education program terms and duration are set by Cursor and may change — confirm current terms on the official page.',
    official_url: 'https://cursor.com/students',
    status: 'verification', featured: 1, tags: ['cursor', 'coding', 'ai-editor', 'students']
  },
  {
    title: 'Figma for Education',
    company_name: 'Figma', tool_name: 'Figma AI', logo_domain: 'figma.com',
    student_benefit: 'Free Professional plan for verified students & educators',
    description: 'Figma for Education gives verified students and educators free access to the Professional plan, including full design, prototyping and collaboration features.',
    offer_type: 'Education Plan', category: 'Design',
    student_price: 'Free',
    eligibility: 'Verified students and educators',
    verification_method: 'School email / Figma Education verification',
    how_to_claim: ['Visit the Figma Education page', 'Sign in or create a Figma account', 'Apply for an Education Org', 'Verify your academic status', 'Professional features are enabled'],
    important_conditions: 'For coursework and learning; education access is reconfirmed periodically.',
    official_url: 'https://www.figma.com/education/',
    status: 'ongoing', featured: 1, tags: ['figma', 'design', 'ui', 'education']
  },
  {
    title: 'Notion for Education',
    company_name: 'Notion', logo_domain: 'notion.com',
    student_benefit: 'Free upgraded plan for verified students & educators',
    description: 'Notion for Education provides verified students, educators and universities free access to Notion’s paid plan features for notes, docs and project work.',
    offer_type: 'Education Plan', category: 'Productivity',
    student_price: 'Free',
    eligibility: 'Verified students, educators and academic institutions',
    verification_method: 'School email / Notion education verification',
    how_to_claim: ['Visit the Notion Education page', 'Sign in with your academic email', 'Apply for the education plan', 'Verify your status', 'Paid features are unlocked'],
    important_conditions: 'Education eligibility is reconfirmed over time; personal accounts must use an academic email where required.',
    official_url: 'https://www.notion.com/education',
    status: 'ongoing', tags: ['notion', 'productivity', 'notes', 'education']
  },
  {
    title: 'Canva for Education',
    company_name: 'Canva', logo_domain: 'canva.com',
    student_benefit: 'Free Canva Pro-level features for verified teachers & students',
    description: 'Canva for Education gives verified K-12 teachers and their students free access to Canva’s premium design features; higher-education access is provided via Canva for Campus.',
    offer_type: 'Education Plan', category: 'Design',
    student_price: 'Free',
    eligibility: 'Verified K-12 teachers and students; universities via Canva for Campus',
    verification_method: 'Teacher/school verification',
    how_to_claim: ['Visit the Canva Education page', 'Sign in or create a Canva account', 'Verify as a teacher or student', 'Join your class or school team', 'Premium features are enabled'],
    important_conditions: 'Primarily for K-12; university access depends on institutional Canva for Campus enrollment.',
    official_url: 'https://www.canva.com/education/',
    status: 'ongoing', tags: ['canva', 'design', 'graphic', 'education']
  },
  {
    title: 'Autodesk Education Access',
    company_name: 'Autodesk', logo_domain: 'autodesk.com',
    student_benefit: 'Free 1-year renewable access to Autodesk software',
    description: 'Autodesk offers verified students and educators free, renewable one-year access to its professional software, including AutoCAD, Maya, Fusion and Revit.',
    offer_type: 'Education Plan', category: 'Design',
    student_price: 'Free',
    eligibility: 'Verified students and educators',
    verification_method: 'SheerID academic verification',
    how_to_claim: ['Visit the Autodesk Education page', 'Create an Autodesk account', 'Verify eligibility via SheerID', 'Choose your software', 'Your education license is activated'],
    important_conditions: 'Renewable annually while eligible; for learning and coursework, not commercial projects.',
    official_url: 'https://www.autodesk.com/education',
    status: 'ongoing', tags: ['autodesk', 'design', 'cad', 'education']
  },
  {
    title: 'Unity for Students',
    company_name: 'Unity', logo_domain: 'unity.com',
    student_benefit: 'Free Unity Pro for verified students',
    description: 'Unity’s education program provides verified students free access to Unity Pro features for game development and real-time 3D coursework.',
    offer_type: 'Education Plan', category: 'Design',
    student_price: 'Free (Pro)',
    eligibility: 'Verified students at accredited institutions',
    verification_method: 'Unity Education / SheerID verification',
    how_to_claim: ['Visit the Unity Education page', 'Create or sign in to a Unity ID', 'Verify your student status', 'Apply the student license', 'Confirm Pro features are active'],
    important_conditions: 'Terms are set by Unity and may change; confirm current student licensing on the official page.',
    official_url: 'https://unity.com/education',
    status: 'verification', tags: ['unity', 'game-dev', '3d', 'education']
  },
  {
    title: 'Framer for Education',
    company_name: 'Framer', logo_domain: 'framer.com',
    student_benefit: 'Free plan upgrade for verified students',
    description: 'Framer for Education offers verified students free access to upgraded site-building and prototyping features for learning and portfolios.',
    offer_type: 'Education Plan', category: 'Design',
    student_price: 'Free',
    eligibility: 'Verified students',
    verification_method: 'Student email / Framer education verification',
    how_to_claim: ['Visit the Framer Education page', 'Sign in to your Framer account', 'Apply with your academic email', 'Verify your status', 'Upgraded features are enabled'],
    important_conditions: 'Education terms are set by Framer; confirm current details on the official page.',
    official_url: 'https://www.framer.com/education/',
    status: 'verification', tags: ['framer', 'design', 'web', 'education']
  },
  {
    title: 'Microsoft Azure for Students',
    company_name: 'Microsoft', logo_domain: 'microsoft.com',
    student_benefit: '$100 Azure credit + 12 months of free services',
    description: 'Azure for Students gives verified students $100 in Azure credit plus free access to popular developer services for 12 months — no credit card required to start.',
    offer_type: 'Developer Credits', category: 'Cloud & Infrastructure',
    student_price: 'Free (with credit)', free_credits: '$100 Azure credit + 12 months of free services',
    eligibility: 'Verified students at academic institutions',
    verification_method: 'Academic email / student verification',
    how_to_claim: ['Visit the Azure for Students page', 'Sign in with a Microsoft account', 'Verify with your academic email', 'Activate the student offer', 'Your credit and free services are applied'],
    important_conditions: 'Credit is time-limited after activation; free-service allotments and eligibility vary by region.',
    official_url: 'https://azure.microsoft.com/en-us/free/students/',
    status: 'ongoing', featured: 1, tags: ['azure', 'cloud', 'credits', 'microsoft']
  },
  {
    title: 'AWS Educate',
    company_name: 'Amazon Web Services', logo_domain: 'aws.amazon.com',
    student_benefit: 'Free cloud training, labs and an AWS account for practice',
    description: 'AWS Educate gives students free, self-paced cloud training, hands-on labs and badges with an AWS account for practice — no credit card required.',
    offer_type: 'Developer Credits', category: 'Cloud & Infrastructure',
    student_price: 'Free', free_credits: 'Hands-on AWS account access for labs (no fixed dollar credit)',
    eligibility: 'Learners 14+ including students and educators',
    verification_method: 'Account registration (no credit card)',
    how_to_claim: ['Visit the AWS Educate page', 'Create a free AWS Educate account', 'Confirm your email', 'Start labs and courses', 'Earn badges as you progress'],
    important_conditions: 'AWS Educate provides a sandboxed learning account rather than a fixed promotional credit; terms may change.',
    official_url: 'https://aws.amazon.com/education/awseducate/',
    status: 'ongoing', tags: ['aws', 'cloud', 'training', 'credits']
  },
  {
    title: 'Google Cloud for Students',
    company_name: 'Google', logo_domain: 'cloud.google.com',
    student_benefit: 'Free Google Cloud Skill Boost + student cloud benefits',
    description: 'Google Cloud for Students gives students free access to Google Cloud Skill Boost (hands-on labs and badges); promotional cloud credits vary by program and region.',
    offer_type: 'Developer Credits', category: 'Cloud & Infrastructure',
    student_price: 'Free (Skill Boost)', free_credits: 'Free Skill Boost access; promotional cloud credits vary by program',
    eligibility: 'Students (age requirements vary by region)',
    verification_method: 'Student email / academic verification',
    how_to_claim: ['Visit the Google Cloud for Students page', 'Sign in with a Google account', 'Verify your student status', 'Enroll in Skill Boost', 'Start free labs and claim available benefits'],
    important_conditions: 'Cloud credit amounts and availability differ by program and country — confirm current terms on the official page.',
    official_url: 'https://cloud.google.com/edu/students',
    status: 'ongoing', tags: ['google-cloud', 'cloud', 'credits', 'skill-boost']
  },
  {
    title: 'DigitalOcean Credit via GitHub Student Pack',
    company_name: 'DigitalOcean', logo_domain: 'digitalocean.com',
    student_benefit: '$200 platform credit (60 days) via GitHub Student Pack',
    description: 'Through the GitHub Student Developer Pack, verified students receive DigitalOcean platform credit to build and host projects on new accounts.',
    offer_type: 'Developer Credits', category: 'Cloud & Infrastructure',
    student_price: 'Free credit', free_credits: '$200 credit valid for 60 days',
    eligibility: 'Verified students with the GitHub Student Developer Pack (new DigitalOcean accounts)',
    verification_method: 'GitHub Student Developer Pack verification',
    how_to_claim: ['Activate the GitHub Student Developer Pack', 'Open the DigitalOcean offer in the Pack', 'Create a new DigitalOcean account', 'Redeem the credit', 'Confirm the balance is applied'],
    important_conditions: 'Credit applies to new accounts and expires after the stated window; standard pricing resumes afterward.',
    official_url: 'https://www.digitalocean.com/github-students',
    status: 'verification', tags: ['digitalocean', 'cloud', 'credits', 'github']
  },
  {
    title: 'Namecheap Free Domain via GitHub Student Pack',
    company_name: 'Namecheap', logo_domain: 'namecheap.com',
    student_benefit: 'Free 1-year .me domain + SSL via GitHub Student Pack',
    description: 'Verified students with the GitHub Student Developer Pack can claim a free one-year .me domain and SSL certificate from Namecheap for personal projects and portfolios.',
    offer_type: 'Free for Students', category: 'Cloud & Infrastructure',
    student_price: 'Free (1 year)',
    eligibility: 'Verified students with the GitHub Student Developer Pack',
    verification_method: 'GitHub Student Developer Pack verification',
    how_to_claim: ['Activate the GitHub Student Developer Pack', 'Open the Namecheap offer in the Pack', 'Create or sign in to a Namecheap account', 'Register the free .me domain', 'Enable the bundled SSL'],
    important_conditions: 'Free for the first year; standard renewal pricing applies afterward. One domain per eligible student.',
    official_url: 'https://www.namecheap.com/github-students/',
    status: 'verification', tags: ['namecheap', 'domain', 'hosting', 'github']
  },
  {
    title: 'Educative Free Subscription via GitHub Student Pack',
    company_name: 'Educative', logo_domain: 'educative.io',
    student_benefit: 'Free Educative subscription via GitHub Student Pack',
    description: 'Through the GitHub Student Developer Pack, verified students receive a free limited-period Educative subscription for interactive coding courses.',
    offer_type: 'Free for Students', category: 'Education',
    student_price: 'Free (limited period)',
    eligibility: 'Verified students with the GitHub Student Developer Pack',
    verification_method: 'GitHub Student Developer Pack verification',
    how_to_claim: ['Activate the GitHub Student Developer Pack', 'Open the Educative offer in the Pack', 'Create an Educative account', 'Redeem the free subscription', 'Confirm access is enabled'],
    important_conditions: 'The free period is limited; standard subscription pricing applies afterward. Course access may vary.',
    official_url: 'https://www.educative.io/github-students',
    status: 'verification', tags: ['educative', 'courses', 'learning', 'github']
  },
  {
    title: 'LinkedIn Learning via University',
    company_name: 'LinkedIn', logo_domain: 'linkedin.com',
    student_benefit: 'Free LinkedIn Learning at participating universities',
    description: 'Many universities subscribe to LinkedIn Learning, giving enrolled students free access to its full course library, including AI, data and software tracks.',
    offer_type: 'Education Plan', category: 'Education',
    student_price: 'Free (via institution)',
    eligibility: 'Students at institutions that subscribe to LinkedIn Learning',
    verification_method: 'University / library authentication',
    how_to_claim: ['Check whether your institution subscribes', 'Sign in with your university credentials', 'Access LinkedIn Learning via your library portal'],
    important_conditions: 'Not universal — availability depends entirely on your institution’s subscription. Confirm with your university library.',
    official_url: 'https://www.linkedin.com/learning/',
    status: 'verification', tags: ['linkedin', 'learning', 'courses', 'university']
  },
  {
    title: 'IEEE Xplore Academic Access',
    company_name: 'IEEE', logo_domain: 'ieee.org',
    student_benefit: 'Research database access via institutional subscription',
    description: 'Students at subscribing institutions get academic access to IEEE Xplore, the digital library for electrical engineering, computer science and AI research papers.',
    offer_type: 'Research Access', category: 'Research',
    student_price: 'Free (via institution)',
    eligibility: 'Enrolled students at subscribing institutions',
    verification_method: 'Institutional / library network authentication',
    how_to_claim: ['Confirm your institution subscribes', 'Connect via your library network or VPN', 'Sign in through institutional authentication', 'Access papers on IEEE Xplore'],
    important_conditions: 'Provided by your university library’s subscription, not an individual student discount; coverage varies by institution.',
    official_url: 'https://ieeexplore.ieee.org/',
    status: 'verification', tags: ['ieee', 'research', 'papers', 'academic']
  },
  {
    title: 'Perplexity for Education',
    company_name: 'Perplexity', tool_name: 'Perplexity', logo_domain: 'perplexity.ai',
    student_benefit: 'Discounted/free Pro for verified students (promotion-dependent)',
    description: 'Perplexity runs education promotions offering discounted or free Pro access to verified students. Exact pricing and availability change by promotion and region.',
    offer_type: 'Student Discount', category: 'Research',
    eligibility: 'Verified students (promotion-dependent)',
    verification_method: 'Student verification (promotion-dependent)',
    how_to_claim: ['Visit the Perplexity education page', 'Check the current promotion', 'Sign in to your Perplexity account', 'Complete student verification if required', 'Confirm the benefit is applied'],
    important_conditions: 'Offer terms, pricing and availability vary by promotion and region — always confirm current details on the official page before relying on them.',
    official_url: 'https://www.perplexity.ai/education',
    status: 'verification', tags: ['perplexity', 'research', 'ai-search', 'students']
  }
];

export function seedIfEmpty(db) {
  const seeded = {};

  // Companies
  const companyCount = db.prepare('SELECT COUNT(*) AS c FROM companies').get().c;
  if (companyCount === 0) {
    const ins = db.prepare(`INSERT INTO companies (name, slug, description, website, logo_url, founded, hq, focus_areas)
      VALUES (@name, @slug, @description, @website, @logo_url, @founded, @hq, @focus_areas)`);
    for (const c of COMPANIES) {
      const domain = c.website.replace(/^https?:\/\//, '').replace(/^www\./, '');
      ins.run({
        name: c.name,
        slug: slugify(c.name),
        description: c.description,
        website: c.website,
        logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        founded: c.founded,
        hq: c.hq,
        focus_areas: J(c.focus_areas)
      });
    }
    seeded.companies = COMPANIES.length;
  }

  // Sources
  const sourceCount = db.prepare('SELECT COUNT(*) AS c FROM sources').get().c;
  if (sourceCount === 0) {
    const ins = db.prepare(`INSERT INTO sources (name, slug, url, feed_url, feed_type, category, active, logo_url, priority)
      VALUES (@name, @slug, @url, @feed_url, @feed_type, @category, @active, @logo_url, @priority)`);
    for (const s of SOURCES) {
      ins.run({ active: 1, ...s, slug: slugify(s.name) });
    }
    seeded.sources = SOURCES.length;
  }

  // Tool categories
  const tcCount = db.prepare('SELECT COUNT(*) AS c FROM tool_categories').get().c;
  if (tcCount === 0) {
    const ins = db.prepare('INSERT INTO tool_categories (name, slug, description) VALUES (?, ?, ?)');
    for (const name of TOOL_CATEGORIES) {
      ins.run(name, slugify(name), `AI tools in the ${name} category`);
    }
    seeded.tool_categories = TOOL_CATEGORIES.length;
  }

  // Tools
  const toolCount = db.prepare('SELECT COUNT(*) AS c FROM tools').get().c;
  if (toolCount === 0) {
    const companyByName = new Map(
      db.prepare('SELECT id, name FROM companies').all().map((r) => [r.name, r.id])
    );
    const ins = db.prepare(`INSERT INTO tools
      (name, slug, description, long_description, website, logo_url, company_id, company_name, category, subcategory,
       pricing_type, open_source, platforms, capabilities, tags, launch_date, featured)
      VALUES (@name, @slug, @description, @long_description, @website, @logo_url, @company_id, @company_name,
       @category, @subcategory, @pricing_type, @open_source, @platforms, @capabilities, @tags, @launch_date, @featured)`);
    for (const t of TOOLS) {
      const [name, company, category, subcategory, pricing_type, open_source, website, description, platforms, capabilities, tags, featured] = t;
      const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      ins.run({
        name,
        slug: slugify(name),
        description,
        long_description: description,
        website,
        logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        company_id: companyByName.get(company) ?? null,
        company_name: company,
        category,
        subcategory,
        pricing_type,
        open_source,
        platforms: J(platforms),
        capabilities: J(capabilities),
        tags: J(tags),
        launch_date: null,
        featured
      });
    }
    seeded.tools = TOOLS.length;
  }

  // Models
  const modelCount = db.prepare('SELECT COUNT(*) AS c FROM models').get().c;
  if (modelCount === 0) {
    const companyByName = new Map(
      db.prepare('SELECT id, name FROM companies').all().map((r) => [r.name, r.id])
    );
    const ins = db.prepare(`INSERT INTO models
      (name, slug, developer, company_id, model_type, release_date, context_length, modalities,
       open_source, api_available, pricing_notes, benchmark_notes, official_url, description)
      VALUES (@name, @slug, @developer, @company_id, @model_type, @release_date, @context_length, @modalities,
       @open_source, @api_available, @pricing_notes, @benchmark_notes, @official_url, @description)`);
    for (const m of MODELS) {
      const [name, developer, model_type, release_date, context_length, modalities, open_source, api_available, pricing_notes, benchmark_notes, official_url, description] = m;
      ins.run({
        name,
        slug: slugify(name),
        developer,
        company_id: companyByName.get(developer) ?? null,
        model_type,
        release_date,
        context_length,
        modalities: J(modalities),
        open_source,
        api_available,
        pricing_notes,
        benchmark_notes,
        official_url,
        description
      });
    }
    seeded.models = MODELS.length;
  }

  // Research papers
  const paperCount = db.prepare('SELECT COUNT(*) AS c FROM research_papers').get().c;
  if (paperCount === 0) {
    const ins = db.prepare(`INSERT INTO research_papers
      (arxiv_id, title, slug, authors, abstract, summary, url, pdf_url, published_at, primary_category, tags, company_slug)
      VALUES (@arxiv_id, @title, @slug, @authors, @abstract, @summary, @url, @pdf_url, @published_at, @primary_category, @tags, @company_slug)`);
    for (const p of PAPERS) {
      const firstSentences = p.abstract.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
      ins.run({
        arxiv_id: p.arxiv_id,
        title: p.title,
        slug: slugify(p.title),
        authors: J(p.authors),
        abstract: p.abstract,
        summary: firstSentences,
        url: `https://arxiv.org/abs/${p.arxiv_id}`,
        pdf_url: `https://arxiv.org/pdf/${p.arxiv_id}`,
        published_at: p.published_at,
        primary_category: p.primary_category,
        tags: J(p.tags),
        company_slug: p.company_slug
      });
    }
    seeded.papers = PAPERS.length;
  }

  // Seed news
  const newsCount = db.prepare('SELECT COUNT(*) AS c FROM news').get().c;
  if (newsCount === 0) {
    const sourceByName = new Map(
      db.prepare('SELECT id, name, slug, logo_url FROM sources').all().map((r) => [r.name, r])
    );
    const ins = db.prepare(`INSERT INTO news
      (title, slug, summary, key_takeaways, why_it_matters, content_snippet, source_id, source_name, source_slug,
       source_logo_url, source_url, image_url, author, published_at, category, tags, importance, is_seed)
      VALUES (@title, @slug, @summary, @key_takeaways, @why_it_matters, @content_snippet, @source_id, @source_name,
       @source_slug, @source_logo_url, @source_url, @image_url, @author, @published_at, @category, @tags, @importance, 1)`);
    const tagIns = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
    const tagId = db.prepare('SELECT id FROM tags WHERE name = ?');
    const linkIns = db.prepare('INSERT OR IGNORE INTO news_tags (news_id, tag_id) VALUES (?, ?)');
    let n = 0;
    for (const a of SEED_NEWS) {
      const src = sourceByName.get(a.source);
      const content = `${a.summary} ${a.takeaways.map((t) => `${t}.`).join(' ')}`;
      const info = ins.run({
        title: a.title,
        slug: slugify(a.title),
        summary: a.summary,
        key_takeaways: J(a.takeaways),
        why_it_matters: a.why,
        content_snippet: content,
        source_id: src ? src.id : null,
        source_name: a.source,
        source_slug: src ? src.slug : slugify(a.source),
        source_logo_url: src ? src.logo_url : null,
        source_url: a.url,
        image_url: a.image_url,
        author: a.author,
        published_at: a.published_at,
        category: a.category,
        tags: J(a.tags),
        importance: a.importance
      });
      const newsId = info.lastInsertRowid;
      for (const tag of a.tags) {
        tagIns.run(tag);
        const row = tagId.get(tag);
        if (row) linkIns.run(newsId, row.id);
      }
      n++;
    }
    seeded.news = n;
  }

  // Student offers
  const offerCount = db.prepare('SELECT COUNT(*) AS c FROM student_offers').get().c;
  if (offerCount === 0) {
    const companyByName = new Map(
      db.prepare('SELECT id, name FROM companies').all().map((r) => [r.name, r.id])
    );
    const toolByName = new Map(
      db.prepare('SELECT id, name FROM tools').all().map((r) => [r.name, r.id])
    );
    const ins = db.prepare(`INSERT INTO student_offers
      (slug, company_id, company_name, tool_id, tool_name, logo_url, title, student_benefit, description,
       offer_type, category, student_price, regular_price, discount_percentage, free_credits, eligibility,
       verification_method, geographic_restrictions, how_to_claim, important_conditions, official_url,
       source_url, status, is_student_only, featured, tags, expiration_date, last_verified_at, last_check_status)
      VALUES (@slug, @company_id, @company_name, @tool_id, @tool_name, @logo_url, @title, @student_benefit, @description,
       @offer_type, @category, @student_price, @regular_price, @discount_percentage, @free_credits, @eligibility,
       @verification_method, @geographic_restrictions, @how_to_claim, @important_conditions, @official_url,
       @source_url, @status, @is_student_only, @featured, @tags, @expiration_date, @last_verified_at, @last_check_status)`);
    for (const o of STUDENT_OFFERS) {
      const domain = o.logo_domain
        || o.official_url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      ins.run({
        slug: slugify(o.title),
        company_id: companyByName.get(o.company_name) ?? null,
        company_name: o.company_name ?? null,
        tool_id: o.tool_name ? (toolByName.get(o.tool_name) ?? null) : null,
        tool_name: o.tool_name ?? null,
        logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        title: o.title,
        student_benefit: o.student_benefit ?? null,
        description: o.description ?? null,
        offer_type: o.offer_type,
        category: o.category,
        student_price: o.student_price ?? null,
        regular_price: o.regular_price ?? null,
        discount_percentage: o.discount_percentage ?? null,
        free_credits: o.free_credits ?? null,
        eligibility: o.eligibility ?? null,
        verification_method: o.verification_method ?? null,
        geographic_restrictions: o.geographic_restrictions ?? null,
        how_to_claim: J(o.how_to_claim || []),
        important_conditions: o.important_conditions ?? null,
        official_url: o.official_url,
        source_url: o.source_url ?? o.official_url,
        status: o.status,
        is_student_only: o.is_student_only === 0 ? 0 : 1,
        featured: o.featured ? 1 : 0,
        tags: J(o.tags || []),
        expiration_date: o.expiration_date ?? null,
        last_verified_at: null,
        last_check_status: null
      });
    }
    seeded.student_offers = STUDENT_OFFERS.length;
  }

  return seeded;
}

// Idempotently add any SOURCES rows that are missing from an existing database.
// seedIfEmpty() only inserts sources when the table is completely empty, so an
// already-running install would never pick up newly-added fetchers. This upserts
// by slug: it inserts sources that don't exist yet and NEVER modifies or
// duplicates rows the admin may have edited. Safe to call on every boot (§5/§35).
export function ensureSources(db) {
  const exists = db.prepare('SELECT 1 FROM sources WHERE slug = ?');
  const ins = db.prepare(`INSERT INTO sources (name, slug, url, feed_url, feed_type, category, active, logo_url, priority)
    VALUES (@name, @slug, @url, @feed_url, @feed_type, @category, @active, @logo_url, @priority)`);
  let added = 0;
  const tx = db.transaction(() => {
    for (const s of SOURCES) {
      const slug = slugify(s.name);
      if (exists.get(slug)) continue;
      ins.run({ active: 1, ...s, slug });
      added++;
    }
  });
  tx();
  return added;
}

// Allow `npm run seed` to seed standalone.
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('seed.js')) {
  const { default: db } = await import('./db.js');
  const result = seedIfEmpty(db);
  console.log('Seed complete:', result);
}
