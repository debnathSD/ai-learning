/*
  Tutorial content for "Deep Dive into LLMs like ChatGPT" (Andrej Karpathy, Feb 2025).
  Unofficial study notes, written in our own words.

  Each step:
    id, part (1-4), title, start/end (lecture timestamps), chapters [[label, time]],
    lead, body (HTML; <div data-demo="name"> mounts an interactive from demos.js),
    takeaways [], terms [[term, definition]], quiz [{q, options, answer, why}]
*/
window.TUTORIAL = {
  video: {
    id: '7xTGNNLPyMI',
    title: 'Deep Dive into LLMs like ChatGPT',
    author: 'Andrej Karpathy',
    published: 'February 5, 2025',
    length: '3:31:23',
    url: 'https://www.youtube.com/watch?v=7xTGNNLPyMI'
  },

  parts: [
    { n: 1, key: 'pre', name: 'Pretraining', blurb: 'Build a base model that simulates internet text.' },
    { n: 2, key: 'sft', name: 'Supervised finetuning', blurb: 'Turn the base model into an assistant, and meet its quirks.' },
    { n: 3, key: 'rl', name: 'Reinforcement learning', blurb: 'Let the model practice, and discover how to think.' },
    { n: 4, key: 'big', name: 'The big picture', blurb: 'Where things are heading, and what it all adds up to.' }
  ],

  steps: [
    /* ───────────────────────── PART 1 ───────────────────────── */
    {
      id: 'data',
      part: 1,
      title: 'Download and filter the internet',
      start: '00:00:00',
      end: '00:07:47',
      chapters: [['Introduction', '00:00:00'], ['Pretraining data (internet)', '00:01:00']],
      lead: 'Everything starts with a giant pile of text. To build a model like ChatGPT, labs collect a huge, high-quality, diverse slice of the public web, and throw most of the raw crawl away.',
      body: `
<p>The lecture's goal is a mental model of what's really behind the ChatGPT text box: how these models are built, what they're good and bad at, and how to use them well. It follows the order a model is built in. The first of three stages is <strong>pretraining</strong>, and pretraining starts with data.</p>

<h2>A filtered slice of the web</h2>
<p>Karpathy uses <a href="https://huggingface.co/spaces/HuggingFaceFW/blogpost-fineweb-v1" target="_blank" rel="noopener">FineWeb</a>, an open dataset from Hugging Face, as a representative example. After all the filtering it's about <strong>44 TB</strong> of text, roughly <strong>15 trillion tokens</strong>. That would fit on a single large hard drive. Every big lab, such as OpenAI, Anthropic and Google, has its own private equivalent.</p>
<p>The raw material usually comes from <strong>Common Crawl</strong>, an organization that has been crawling the public web since 2007. By 2024 it had indexed about 2.7 billion web pages. Raw crawls are messy, so they go through a pipeline like this one:</p>

<div data-demo="pipeline"></div>

<p>Each stage is a design decision. Language filtering is a good example: if a lab filters out most Spanish pages, the model will simply be weaker at Spanish.</p>
<p>What survives is a long stream of articles, recipes, forum threads, documentation and more. Stitch even 200 of these pages together and you get a dense wall of text. The full dataset is millions of times bigger, and the neural network's job will be to model how all of that text flows.</p>

<aside class="note"><p><strong>Mental model:</strong> the pretraining dataset is the model's entire world. Whatever is missing from it, or filtered out of it, the model will know little about.</p></aside>
`,
      takeaways: [
        'An LLM\'s knowledge comes from a filtered snapshot of the public web.',
        'Quantity, quality and diversity of data all matter, and every filtering choice shapes the final model.'
      ],
      terms: [
        ['Pretraining', 'The first and most expensive training stage, where a model learns from a huge amount of internet text.'],
        ['FineWeb', 'An open, filtered web-text dataset from Hugging Face (about 44 TB, roughly 15 trillion tokens), used in the lecture as a typical pretraining dataset.'],
        ['Common Crawl', 'An organization that has crawled and archived the public web since 2007; the raw source for most web datasets.'],
        ['PII', 'Personally identifiable information, such as addresses or ID numbers, which is filtered out of training data.']
      ],
      quiz: [
        {
          q: 'Roughly how big is FineWeb, the example pretraining dataset?',
          options: ['About 44 GB: it fits on a phone', 'About 44 TB, roughly 15 trillion tokens', 'About 44 petabytes, the size of the whole internet'],
          answer: 1,
          why: 'Even after heavy filtering, a high-quality slice of the web is "only" about 44 TB, small enough for one large hard drive. Most of the raw crawl is thrown away.'
        },
        {
          q: 'A lab keeps only pages that are mostly English. What happens to the model?',
          options: ['Nothing; models learn every language anyway', 'It translates other languages perfectly', 'It ends up weaker in other languages'],
          answer: 2,
          why: 'The model can only learn what is in its data. Filtering choices, like FineWeb keeping pages that are more than 65% English, directly shape what it can do.'
        }
      ]
    },

    {
      id: 'tokens',
      part: 1,
      title: 'Turn text into tokens',
      start: '00:07:47',
      end: '00:14:27',
      chapters: [['Tokenization', '00:07:47']],
      lead: 'A neural network needs its input as a one-dimensional sequence of symbols from a fixed vocabulary. Tokenization turns text into that sequence, trading a bigger vocabulary for a shorter sequence.',
      body: `
<h2>From bits to bytes to tokens</h2>
<ol>
<li><strong>Bits.</strong> Encode text with UTF-8 and you get raw bits: only two symbols (0 and 1), but an extremely long sequence. Sequence length is precious, because a model can only look at a limited window at once.</li>
<li><strong>Bytes.</strong> Group every 8 bits into a byte. Now there are 256 possible symbols (0 to 255) and the sequence is 8 times shorter.</li>
<li><strong>Byte pair encoding (BPE).</strong> Find the pair of neighboring symbols that occurs most often, say byte 116 followed by byte 32, and mint a new symbol, number 256, that stands for that pair. Replace every occurrence, then repeat. Each merge adds one symbol to the vocabulary and makes the sequence shorter.</li>
</ol>
<p>In practice about 100,000 symbols is a sweet spot; GPT-4's tokenizer has <strong>100,277</strong>. These symbols are called <strong>tokens</strong>, and converting text into them is <strong>tokenization</strong>. Run FineWeb through a tokenizer and its 44 TB becomes one sequence of about 15 trillion tokens.</p>
<p>Tokens are often whole words or pieces of words, usually with the space in front attached. Tiny changes matter: "hello world", "Hello world" and "hello&nbsp;&nbsp;world" (two spaces) all tokenize differently. Karpathy explores this with <a href="https://tiktokenizer.vercel.app/" target="_blank" rel="noopener">Tiktokenizer</a>; choose the <code>cl100k_base</code> encoding to see GPT-4's tokens.</p>

<div data-demo="tokenizer"></div>

<aside class="note"><p><strong>Mental model:</strong> a model never sees letters. It sees a list of integers: in GPT-4's tokenizer, "hello world" is <code>[15339, 1917]</code>. Keep this in mind; it explains several odd failures in step 10.</p></aside>
`,
      takeaways: [
        'Models read and write token IDs, not characters.',
        'BPE balances vocabulary size against sequence length; around 100,000 tokens is typical.'
      ],
      terms: [
        ['Token', 'The basic unit an LLM reads and writes: a chunk of text (often a word or part of a word) with an ID number.'],
        ['Tokenization', 'Converting text into a sequence of tokens, and back again.'],
        ['Byte pair encoding (BPE)', 'A way to build a vocabulary by repeatedly merging the most frequent pair of neighboring symbols into a new symbol.'],
        ['Vocabulary', 'The fixed set of tokens a model knows. GPT-4\'s has 100,277.'],
        ['UTF-8', 'The standard way to encode text as bytes; one character takes 1 to 4 bytes.']
      ],
      quiz: [
        {
          q: 'What does each BPE merge do?',
          options: ['Splits every word into individual letters', 'Replaces the most frequent neighboring pair with a new symbol, so the vocabulary grows by one and the sequence gets shorter', 'Removes rare words from the text'],
          answer: 1,
          why: 'Each merge mints one new token for a common pair. Repeat it tens of thousands of times and you get a vocabulary like GPT-4\'s.'
        },
        {
          q: 'How many tokens are in GPT-4\'s vocabulary?',
          options: ['256', '50,257', '100,277'],
          answer: 2,
          why: '256 is the raw byte vocabulary, and 50,257 is GPT-2\'s. GPT-4\'s cl100k_base tokenizer has 100,277.'
        }
      ]
    },

    {
      id: 'training',
      part: 1,
      title: 'Train a network to predict the next token',
      start: '00:14:27',
      end: '00:26:01',
      chapters: [['Neural network I/O', '00:14:27'], ['Neural network internals', '00:20:11']],
      lead: 'Pretraining is one simple game, played trillions of times: given a window of tokens, predict the token that comes next.',
      body: `
<h2>The input and the output</h2>
<ol>
<li>Take a random window of consecutive tokens from the dataset. It can be anywhere from a single token up to a maximum, say 8,000 tokens. This is the <strong>context</strong>.</li>
<li>The token that actually came next in the data is the <strong>label</strong>, the right answer.</li>
<li>Feed the context to the neural network. It outputs one probability for every token in the vocabulary: 100,277 numbers saying how likely each one is to come next.</li>
<li>At first the network's <strong>parameters</strong> (also called weights) are random, so its guesses are random too. Because we know the right answer, we can work out how to nudge every parameter so the correct token becomes a little more likely.</li>
</ol>
<p>Do that for huge batches of windows at once, over and over, and the network's predictions slowly come to match the statistics of the training text. That's what <strong>training</strong> means here.</p>

<div data-demo="trainStep"></div>

<h2>Inside the network</h2>
<p>The network itself is a giant mathematical expression. The input tokens are mixed with billions of parameters through simple operations like multiplication and addition, and out come the probabilities. The particular arrangement of that expression is the <strong>architecture</strong>; today's LLMs use the <strong>Transformer</strong>.</p>
<p>Karpathy walks through a <a href="https://bbycroft.net/llm" target="_blank" rel="noopener">3D visualization</a> of a small Transformer with about 85,000 parameters. Each token is first turned into a list of numbers, its <strong>embedding</strong>. Information then flows up through repeated blocks: <strong>attention</strong>, where tokens exchange information with each other, and <strong>MLP</strong> layers, which process each token separately. At the top, the network outputs the next-token probabilities.</p>
<p>Two properties are worth remembering:</p>
<ul>
<li>It's <strong>stateless</strong>. There's no memory between calls, just a fixed function from input tokens to output probabilities.</li>
<li>Its "neurons" are extremely simple compared to biological ones. It's a big but fixed piece of math, so there's no need to mystify it.</li>
</ul>
`,
      takeaways: [
        'Pretraining means predicting the next token, at an enormous scale.',
        'An LLM is a fixed mathematical function with billions of tunable parameters.'
      ],
      terms: [
        ['Parameters (weights)', 'The billions of numbers inside a network that training adjusts. Together they store what the model has learned.'],
        ['Context window', 'The tokens a model can look at when predicting the next one, up to a fixed maximum length.'],
        ['Loss', 'A single number measuring how badly the model predicts the next token. Training pushes it down.'],
        ['Transformer', 'The neural network architecture used by modern LLMs, built from attention and MLP blocks.'],
        ['Attention', 'The part of a Transformer where tokens exchange information with each other.'],
        ['Embedding', 'The list of numbers a token is converted into at the start of the network.']
      ],
      quiz: [
        {
          q: 'During pretraining, what is the network trained to do?',
          options: ['Answer questions written by human labelers', 'Memorize every web page word for word', 'Predict the next token, given the tokens before it'],
          answer: 2,
          why: 'That single objective, next-token prediction, is the whole of pretraining. Everything else emerges from doing it well across trillions of tokens.'
        },
        {
          q: 'Where do the network\'s parameters start, before training?',
          options: ['As random numbers', 'Copied from a dictionary', 'Set by hand by engineers'],
          answer: 0,
          why: 'They start random, so the first predictions are random. Each training step nudges them so the correct next tokens become more likely.'
        },
        {
          q: 'What does it mean that the model is "stateless"?',
          options: ['It forgets its training after each day', 'It has no memory between calls; it\'s a fixed function of the tokens you give it', 'It can\'t store any knowledge'],
          answer: 1,
          why: 'Knowledge lives in the fixed parameters; anything the model "remembers" within a chat is just the tokens in its context window.'
        }
      ]
    },

    {
      id: 'inference',
      part: 1,
      title: 'Generate text, one token at a time',
      start: '00:26:01',
      end: '00:31:09',
      chapters: [['Inference', '00:26:01']],
      lead: 'To generate text, the model repeatedly samples the next token from its predicted probabilities and appends it, like flipping a biased coin over and over.',
      body: `
<p>Once a network is trained, generating text, which is called <strong>inference</strong>, is a simple loop:</p>
<ol>
<li>Start with some tokens: the prefix.</li>
<li>Run the network to get next-token probabilities.</li>
<li><strong>Sample</strong> one token from those probabilities. Likely tokens come up often, unlikely ones rarely.</li>
<li>Append that token to the sequence, and go back to step 2.</li>
</ol>
<p>In the lecture the prefix is token 91. The model predicts a distribution, token 860 gets sampled, and the sequence grows one token at a time from there.</p>
<p>Because every step involves a random draw, generation is <strong>stochastic</strong>: the same prompt can produce different text each time. The output isn't copied from the training data; it's a remix with similar statistics, although sometimes a stretch of training text does come out word for word.</p>
<p>This is all that happens when you chat with ChatGPT. Training happened once, months earlier. The weights are now fixed, and every reply is the model completing a token sequence, one sampled token at a time.</p>

<div data-demo="sampler"></div>
`,
      takeaways: [
        'Generation is a loop: predict, sample, append, repeat.',
        'Outputs are statistical remixes of the training data, not lookups, so they vary from run to run.'
      ],
      terms: [
        ['Inference', 'Using a trained model to generate output. The parameters stay fixed.'],
        ['Sampling', 'Picking the next token at random according to the model\'s probabilities.'],
        ['Stochastic', 'Involving randomness, so the same input can give different outputs.'],
        ['Temperature', 'A sampling setting. Low values stick to the most likely tokens; high values make unlikely tokens more likely.'],
        ['Regurgitation', 'When a model reproduces training text word for word.']
      ],
      quiz: [
        {
          q: 'When you send ChatGPT a message, is the model being trained?',
          options: ['Yes, it updates its parameters after every message', 'No. The weights are fixed and it\'s only doing inference', 'Only during long conversations'],
          answer: 1,
          why: 'Training is done ahead of time. Chatting is pure inference: the fixed network completes the token sequence you give it.'
        },
        {
          q: 'Why can the same prompt give different answers?',
          options: ['Each token is sampled from a probability distribution', 'The model looks the answer up on a random website', 'Different servers run different models'],
          answer: 0,
          why: 'Every step is a weighted random draw, so different runs can take different paths through the possible continuations.'
        }
      ]
    },

    {
      id: 'gpt2',
      part: 1,
      title: 'A real training run: GPT-2',
      start: '00:31:09',
      end: '00:42:52',
      chapters: [['GPT-2: training and inference', '00:31:09']],
      lead: 'GPT-2, released by OpenAI in 2019, was the first recognizably modern LLM. Karpathy reproduces its training to show what a run looks like, and how much cheaper it has become.',
      body: `
<h2>The model</h2>
<ul>
<li>About 1.6 billion parameters.</li>
<li>A maximum context of 1,024 tokens.</li>
<li>Trained on about 100 billion tokens.</li>
</ul>
<p>Modern models are bigger in every dimension, with hundreds of billions of parameters, trillions of training tokens and much longer contexts, but the recipe has barely changed.</p>

<h2>The cost keeps falling</h2>
<p>Training GPT-2 in 2019 cost an estimated $40,000. Karpathy's reproduction with his <a href="https://github.com/karpathy/llm.c/discussions/677" target="_blank" rel="noopener">llm.c</a> project took about a day and roughly $600, and he thinks it could get close to $100. Cleaner data, faster hardware and better software all compound.</p>

<h2>What a run looks like</h2>
<p>The training log prints one line per update to the network. Each update processes about <strong>1 million tokens</strong>, and the whole run is <strong>32,000 updates</strong>, over 30 billion tokens in total. The number to watch is the <strong>loss</strong>: lower is better, and it falls as training goes on.</p>
<p>Every 20 steps the run also generates some text. At step 1 it's gibberish. Around step 420 it's locally coherent but makes no sense overall. By the end it reads as plausible English.</p>

<div data-demo="trainingRun"></div>

<h2>Why everyone wants GPUs</h2>
<p>The run uses one cloud machine with 8 NVIDIA H100 GPUs, rented for about $3 per GPU per hour. GPUs are built for exactly the massively parallel arithmetic that training needs, which is why demand for them exploded: NVIDIA's market value reached around $3.4 trillion, and labs build data centers with 100,000 or more GPUs. All of that hardware is doing what this run does, getting better at predicting the next token.</p>
`,
      takeaways: [
        'The recipe hasn\'t changed much since GPT-2. Scale (data, parameters, compute) has.',
        'Training cost is mostly GPU time, and the cost of a given capability keeps falling.'
      ],
      terms: [
        ['GPT-2', 'OpenAI\'s 2019 model with about 1.6 billion parameters; the first recognizably modern LLM.'],
        ['llm.c', 'Karpathy\'s open-source project that trains GPT-2-style models in plain C/CUDA.'],
        ['GPU (H100)', 'A chip built for massively parallel arithmetic. The NVIDIA H100 was the workhorse for training LLMs.'],
        ['Training step (update)', 'One adjustment of all the parameters, based on one batch of training windows.']
      ],
      quiz: [
        {
          q: 'In the GPT-2 reproduction, roughly how many tokens does each update process?',
          options: ['About a thousand', 'About a million', 'About a trillion'],
          answer: 1,
          why: 'Each of the 32,000 updates processes about 1 million tokens, which adds up to over 30 billion tokens for the whole run.'
        },
        {
          q: 'What does a falling loss tell you?',
          options: ['The model is predicting the next token in the training data better', 'The model is forgetting what it learned', 'The GPUs are running cooler'],
          answer: 0,
          why: 'Loss measures how wrong the next-token predictions are, so lower is better.'
        },
        {
          q: 'Why are GPUs in such demand for LLMs?',
          options: ['They store the training data', 'They draw the chat interface', 'Training is massively parallel arithmetic, which GPUs do extremely well'],
          answer: 2,
          why: 'Training is mostly huge matrix multiplications done in parallel, the kind of work GPUs are built for.'
        }
      ]
    },

    {
      id: 'base-model',
      part: 1,
      title: 'Meet a base model: Llama 3.1',
      start: '00:42:52',
      end: '00:59:23',
      chapters: [['Llama 3.1 base model inference', '00:42:52']],
      lead: 'A model straight out of pretraining isn\'t an assistant. It\'s an internet document simulator: give it the beginning of a document and it continues it.',
      body: `
<p>Most labs never release their <strong>base models</strong>, but a few do. Meta's <strong>Llama 3.1 405B</strong>, with 405 billion parameters trained on about 15 trillion tokens, was released both as a base model and as an "instruct" model, the assistant version. A released model is really just two things: the code that describes the network, and a large file of parameters.</p>
<p>Karpathy talks to the base model on <a href="https://app.hyperbolic.xyz/" target="_blank" rel="noopener">Hyperbolic</a>, one of the few places that serve it.</p>

<h2>What a base model does</h2>
<ul>
<li><strong>It continues instead of answering.</strong> Type "What is 2+2?" and you may get more questions, as if it were partway through a quiz page. Run it again and the continuation changes.</li>
<li><strong>It's a lossy compression of the internet.</strong> 405 billion parameters can't store 15 trillion tokens exactly, but they hold a lot of knowledge. Start a "Top 10 landmarks in Paris" list and the continuation is roughly right, a vague recollection of what it read.</li>
<li><strong>It can regurgitate.</strong> Paste the first sentence of the Wikipedia article on zebras and it can continue almost word for word. High-quality sources like Wikipedia are seen several times during training, so they get memorized. Labs generally try to avoid this.</li>
<li><strong>It hallucinates past its knowledge cutoff.</strong> Llama 3's training data ends around the end of 2023. Ask about the 2024 US election and it confidently writes its best guess, a different one each time.</li>
</ul>

<h2>Prompting a base model</h2>
<p>Base models are still useful if you set up the document cleverly:</p>
<ul>
<li><strong>Few-shot prompting.</strong> Write ten English words with their Korean translations, then one more English word followed by a colon. The model spots the pattern and fills in the translation. Learning from examples inside the prompt like this is called <strong>in-context learning</strong>.</li>
<li><strong>A homemade assistant.</strong> Write the start of a page containing a conversation between a helpful AI assistant and a human, then add a new question. The base model plays the assistant's part, because that's the most likely way for the document to continue.</li>
</ul>

<div data-demo="basePrompts"></div>
`,
      takeaways: [
        'A base model is an internet document simulator: it continues text, it doesn\'t converse.',
        'Knowledge in its parameters is a vague, lossy recollection: sometimes memorized exactly, sometimes made up.'
      ],
      terms: [
        ['Base model', 'A model after pretraining only. It continues documents rather than answering like an assistant.'],
        ['Instruct model', 'A base model that has been post-trained into an assistant.'],
        ['Knowledge cutoff', 'The date the training data ends. The model knows nothing reliable after it.'],
        ['In-context learning', 'A model picking up a task from examples or instructions in its prompt, without any training.'],
        ['Few-shot prompt', 'A prompt that shows a few examples of a task so the model continues the pattern.'],
        ['Hallucination', 'Confidently generated text that isn\'t true.']
      ],
      quiz: [
        {
          q: 'You type "What is 2+2?" into a base model. What\'s most likely to happen?',
          options: ['It replies "4", like an assistant would', 'It continues the text as if it were part of a web page, maybe with more questions', 'It refuses to answer'],
          answer: 1,
          why: 'A base model has only learned to continue internet documents. Answering like an assistant comes later, from post-training.'
        },
        {
          q: 'Why can Llama 3.1 recite part of a Wikipedia article almost word for word?',
          options: ['It searches Wikipedia while it writes', 'It was trained only on Wikipedia', 'High-quality sources like Wikipedia are seen several times in training, so they get memorized'],
          answer: 2,
          why: 'Text the model sees repeatedly gets memorized. That\'s regurgitation, and labs usually try to limit it.'
        },
        {
          q: 'What is few-shot prompting?',
          options: ['Showing a few examples of a task in the prompt so the model continues the pattern', 'Training a model for just a few steps', 'Asking several short questions in a row'],
          answer: 0,
          why: 'The examples set up a pattern, and the model completes it. No training is involved; this is in-context learning.'
        }
      ]
    },

    /* ───────────────────────── PART 2 ───────────────────────── */
    {
      id: 'sft',
      part: 2,
      title: 'Make it an assistant: conversation data',
      start: '00:59:23',
      end: '01:20:32',
      chapters: [['Pretraining to post-training', '00:59:23'], ['Post-training data (conversations)', '01:01:06']],
      lead: 'Post-training turns the internet document simulator into an assistant, by continuing training on a dataset of ideal conversations written by people, and increasingly by LLMs.',
      body: `
<p>Pretraining is the expensive part: months of computation on thousands of GPUs, costing millions of dollars. The next stage, <strong>post-training</strong>, is far cheaper, more like hours, because its dataset is much smaller.</p>

<h2>Train on conversations</h2>
<p>The new dataset is a large collection, often hundreds of thousands, of example conversations: a human asks something and an ideal assistant replies, sometimes over several turns. The model keeps training exactly as before, predicting the next token, but now on this data. This is <strong>supervised finetuning (SFT)</strong>. The model quickly picks up the assistant's style and persona while keeping the knowledge from pretraining.</p>

<h2>Conversations are tokens too</h2>
<p>To train on conversations, they're flattened into a single token sequence, with <strong>special tokens</strong> marking who is speaking. In GPT-4o's format, each turn looks like <code>&lt;|im_start|&gt;user&lt;|im_sep|&gt;</code> … <code>&lt;|im_end|&gt;</code>. These tokens never appear in internet text; they're introduced in post-training. When you press Enter in ChatGPT, the server builds this sequence, adds <code>&lt;|im_start|&gt;assistant&lt;|im_sep|&gt;</code> at the end, and lets the model sample what comes next.</p>

<div data-demo="chatTokens"></div>

<h2>Who writes the ideal answers?</h2>
<p>In OpenAI's <a href="https://arxiv.org/abs/2203.02155" target="_blank" rel="noopener">InstructGPT paper</a> (2022), human labelers hired through Upwork and Scale AI wrote both the prompts and the ideal responses. They followed labeling instructions that can run to hundreds of pages but boil down to: be <strong>helpful, truthful and harmless</strong>. Open projects like OpenAssistant did the same thing in public.</p>
<p>Today, LLMs help write this data. Datasets such as UltraChat contain millions of mostly synthetic conversations, with people editing and checking rather than writing everything from scratch.</p>

<aside class="note"><p><strong>Mental model:</strong> when you ask ChatGPT something, you get a statistical simulation of a skilled human labeler following the company's labeling instructions. It's like asking that labeler, not some magical intelligence.</p></aside>
`,
      takeaways: [
        'An assistant is a base model plus SFT on example conversations.',
        'Its personality comes from the labeling instructions: you\'re talking to a simulation of a labeler.'
      ],
      terms: [
        ['Post-training', 'Everything after pretraining that turns a base model into a useful assistant: SFT, RL and RLHF.'],
        ['Supervised finetuning (SFT)', 'Continuing next-token training on a curated dataset of ideal conversations.'],
        ['Special tokens', 'Tokens such as <|im_start|> and <|im_end|> that mark conversation turns. They never appear in ordinary text.'],
        ['Labeling instructions', 'The guidelines human labelers follow when writing ideal responses: helpful, truthful and harmless.'],
        ['Synthetic data', 'Training data generated by models, usually checked or edited by people.']
      ],
      quiz: [
        {
          q: 'How does SFT train the model?',
          options: ['With a completely different algorithm that teaches facts', 'With the same next-token prediction as before, but on a dataset of ideal conversations', 'By writing rules about what the model may say'],
          answer: 1,
          why: 'Nothing about the training algorithm changes. Only the data does, and that\'s enough to change the model\'s behavior.'
        },
        {
          q: 'Which stage is far cheaper and faster?',
          options: ['Post-training, which takes hours rather than months', 'Pretraining', 'They cost the same'],
          answer: 0,
          why: 'Pretraining runs for months on thousands of GPUs. The conversation dataset is much smaller, so post-training is far cheaper.'
        },
        {
          q: 'According to the lecture, what is a ChatGPT reply most like?',
          options: ['A search engine result', 'The opinion of a conscious being', 'What a skilled human labeler, following the company\'s instructions, would likely write'],
          answer: 2,
          why: 'SFT trains the model to imitate the labelers\' ideal answers, so its replies are a statistical simulation of them.'
        }
      ]
    },

    {
      id: 'hallucinations',
      part: 2,
      title: 'Hallucinations, tools and working memory',
      start: '01:20:32',
      end: '01:41:46',
      chapters: [['Hallucinations, tool use, knowledge/working memory', '01:20:32']],
      lead: 'Models make things up because their training data is full of confident answers. The fixes: teach them to say "I don\'t know", and give them tools like search so facts land in their working memory.',
      body: `
<h2>Why models make things up</h2>
<p>In the training conversations, a question like "Who is Tom Cruise?" gets a confident, informative answer. The model learns that <em>style</em>. So when Karpathy asks an older model, Falcon 7B, about a person he invented, "Orson Kovats", it confidently describes an author, then a TV character, then a baseball player: a different story each time. It imitates a confident answer without the knowledge behind it. A modern assistant instead says it can't find anyone well known by that name.</p>

<h2>Fix 1: teach it to say "I don't know"</h2>
<p>Meta describes one approach in the <a href="https://arxiv.org/abs/2407.21783" target="_blank" rel="noopener">Llama 3 paper</a>:</p>
<ol>
<li>Take snippets of training documents and use an LLM to write factual questions and answers about them.</li>
<li>Ask the model each question several times.</li>
<li>Use an LLM to judge whether its answers are right.</li>
<li>Where the model is consistently wrong, add training conversations in which the correct reply is something like "Sorry, I don't know."</li>
</ol>
<p>The network probably already has internal signals for uncertainty. This training connects them to actually admitting it.</p>

<h2>Fix 2: let it look things up</h2>
<p>Give the model a tool. It can emit special tokens such as <code>&lt;SEARCH_START&gt;</code> query <code>&lt;SEARCH_END&gt;</code>. The system pauses the model, runs the search, pastes the results into the conversation, and the model carries on with that text in front of it. Training examples show the model when and how to search.</p>

<div data-demo="toolUse"></div>

<h2>Vague recollection versus working memory</h2>
<ul>
<li>Knowledge in the <strong>parameters</strong> is like something you read a month ago: vague and lossy.</li>
<li>Text in the <strong>context window</strong> is like what's in front of you right now: the model can use it directly.</li>
</ul>
<p>So "Summarize chapter 1 of Pride and Prejudice" will usually work, but pasting the chapter into the prompt and then asking works better.</p>
`,
      takeaways: [
        'Parameters are a vague recollection; the context window is working memory. Paste in what matters.',
        'For niche or recent facts, prefer a model that can search, and check its sources.'
      ],
      terms: [
        ['Tool use', 'A model emitting special tokens that trigger an external tool, such as search or a code interpreter, whose output is pasted back into its context.'],
        ['Working memory', 'Karpathy\'s analogy for the context window: information the model can use directly and reliably.'],
        ['Knowledge probing', 'Meta\'s method of quizzing a model on facts to find what it doesn\'t know, then training it to say so.']
      ],
      quiz: [
        {
          q: 'Why do models hallucinate, according to the lecture?',
          options: ['They imitate the confident style of answers in their training data, even without the knowledge', 'They are programmed to lie', 'Their search engine returns wrong results'],
          answer: 0,
          why: 'Training conversations almost always show confident answers, so that\'s the style the model reproduces, whether or not it knows.'
        },
        {
          q: 'Where is information most reliable for a model?',
          options: ['In its parameters, from training', 'In its context window, the text in the conversation', 'In its system clock'],
          answer: 1,
          why: 'Text in the context window is directly available, like working memory. Parameters hold only a lossy recollection.'
        },
        {
          q: 'How does Meta\'s Llama 3 recipe reduce hallucinations?',
          options: ['It deletes uncertain neurons', 'It bans questions about people', 'It finds questions the model consistently gets wrong and trains it to answer "I don\'t know" to them'],
          answer: 2,
          why: 'Probing reveals what the model doesn\'t know; adding "I don\'t know" examples teaches it to admit that.'
        }
      ]
    },

    {
      id: 'thinking-tokens',
      part: 2,
      title: 'Knowledge of self, and tokens to think',
      start: '01:41:46',
      end: '02:01:11',
      chapters: [['Knowledge of self', '01:41:46'], ['Models need tokens to think', '01:46:56']],
      lead: 'A model has no persistent self, so "Who are you?" gets more imitation. And each token gets only a small, fixed amount of computation, so reasoning has to be spread over many tokens.',
      body: `
<h2>Knowledge of self</h2>
<p>Asking a model "What are you?" or "Who built you?" rarely tells you anything real. It's a token simulator that starts up, processes tokens and shuts off, with no persistent self to introspect. Left alone, it gives the statistically likely answer. Falcon 7B, for example, claimed it was built by OpenAI on GPT-3, because so much internet text is about ChatGPT.</p>
<p>When a model does answer correctly, its identity was put there on purpose. Allen AI's open OLMo model includes about 240 training conversations along the lines of "What's your name?" followed by "I'm OLMo, made by Allen AI". Other labs put identity into a hidden <strong>system message</strong> at the start of every conversation.</p>

<h2>Models need tokens to think</h2>
<p>For each token it produces, the network runs through a fixed number of layers. That's a fixed, fairly small amount of computation per token, so you can't expect much reasoning to happen inside any single token.</p>
<p>Karpathy's example: <em>Emily buys 3 apples and 2 oranges. Each orange costs $2. The total cost of all the fruit is $13. What is the cost of each apple?</em> Here are two answers a labeler might write. Which one makes better training data?</p>

<div data-demo="thinkTokens"></div>

<p>Labelers are taught to write answers like B, and it matters. Force a model to answer a harder version, say with 23 apples and 177 oranges, in a single token, and it often gets it wrong.</p>

<h2>Better still: use tools</h2>
<p>Mental arithmetic in tokens is unreliable, so ask the model to <strong>use code</strong>. It writes a few lines of Python, the code runs, and the result is exact. Counting works the same way. Ask "How many dots are below?" over a long row of dots and the model has to guess, because many dots get merged into a few tokens. Ask it to use code and it copies the dots into a Python string and calls <code>.count()</code>.</p>
`,
      takeaways: [
        'Don\'t expect a model to introspect about itself; its identity is trained in or set by a system message.',
        'Let models show their work, and for math and counting, ask them to use code.'
      ],
      terms: [
        ['System message', 'Hidden instructions placed at the start of a conversation, for example telling the model its name.'],
        ['Forward pass', 'One run of the network over the input to produce the next-token probabilities. It does a fixed amount of computation.'],
        ['Chain of thought', 'Intermediate reasoning written out in tokens before the final answer.']
      ],
      quiz: [
        {
          q: 'Why do models need "tokens to think"?',
          options: ['Tokens are how models pay for computing time', 'Each token gets only a fixed amount of computation, so hard reasoning must be spread across many tokens', 'Longer answers make users happier'],
          answer: 1,
          why: 'A forward pass has a fixed number of layers. Writing out intermediate steps lets later tokens build on earlier results.'
        },
        {
          q: 'A model says "I\'m ChatGPT, made by OpenAI", but it\'s really another model. What\'s the most likely reason?',
          options: ['It\'s imitating text that\'s common on the internet; it has no real self-knowledge unless trained or told', 'It was secretly made by OpenAI', 'It\'s lying on purpose'],
          answer: 0,
          why: 'Without hardcoded identity data or a system message, the model just produces the statistically likely answer.'
        },
        {
          q: 'What\'s the best way to get exact arithmetic on big numbers?',
          options: ['Ask it to answer in one word', 'Ask it to answer quickly', 'Ask it to use code, so a tool does the math'],
          answer: 2,
          why: 'Code runs exactly; mental arithmetic in a few tokens doesn\'t.'
        }
      ]
    },

    {
      id: 'jagged',
      part: 2,
      title: 'Spelling, counting and jagged intelligence',
      start: '02:01:11',
      end: '02:07:28',
      chapters: [['Tokenization revisited: models struggle with spelling', '02:01:11'], ['Jagged intelligence', '02:04:53']],
      lead: 'Models see tokens, not letters, so character-level tasks trip them up. And their abilities are jagged: brilliant at hard problems, sometimes wrong on easy ones.',
      body: `
<h2>Spelling is hard when you see tokens</h2>
<p>Ask for every third character of "ubiquitous", starting with the first, and the answer should be "uqts". To the model, though, the word is a few tokens, not ten letters, so it often gets this wrong. Ask it to use code and it gets it right.</p>
<p>The famous example is "How many r's are in strawberry?" For a long time top models insisted the answer was 2. It's 3. The question combines two weaknesses: counting, and seeing individual characters.</p>

<div data-demo="spelling"></div>

<h2>Jagged intelligence</h2>
<p>A model that solves olympiad-level math problems might tell you that 9.11 is bigger than 9.9. Researchers who looked inside a model on this question found that features associated with Bible verses lit up, and in Bible verse numbering, 9:11 does come after 9:9. The model gets distracted by an association that's right in a different context.</p>

<aside class="note"><p><strong>Mental model:</strong> Swiss cheese. A model's abilities are excellent across most of the surface, with random holes. Being great at hard problems doesn't guarantee being right on easy ones, so use models as tools and check their work.</p></aside>
`,
      takeaways: [
        'For character-level tasks like spelling and counting letters, ask the model to use code.',
        'Strong on hard problems doesn\'t mean reliable on easy ones. Always verify.'
      ],
      terms: [
        ['Jagged intelligence', 'The uneven shape of LLM abilities: superhuman on some tasks, surprisingly wrong on simple ones.'],
        ['Swiss cheese model', 'Karpathy\'s picture of LLM capabilities: solid almost everywhere, with random holes.']
      ],
      quiz: [
        {
          q: 'Why do LLMs struggle to count the letters in a word?',
          options: ['They can\'t read English', 'Letters are removed during training', 'They see the word as a few tokens, not as individual characters'],
          answer: 2,
          why: 'Tokens bundle several characters together, so the model has no direct view of single letters.'
        },
        {
          q: 'Which is bigger, 9.11 or 9.9?',
          options: ['9.11', '9.9', 'They\'re equal'],
          answer: 1,
          why: '9.9 is 9.90, which is bigger than 9.11. Some strong models have gotten this wrong: a classic Swiss cheese hole.'
        },
        {
          q: 'How many r\'s are in "strawberry"?',
          options: ['2', '3', '4'],
          answer: 1,
          why: 'Three: s-t-R-a-w-b-e-R-R-y. Models long said 2, because they see tokens rather than letters.'
        }
      ]
    },

    /* ───────────────────────── PART 3 ───────────────────────── */
    {
      id: 'rl',
      part: 3,
      title: 'Practice makes perfect: reinforcement learning',
      start: '02:07:28',
      end: '02:27:47',
      chapters: [['Supervised finetuning to reinforcement learning', '02:07:28'], ['Reinforcement learning', '02:14:42']],
      lead: 'SFT teaches a model to imitate experts. Reinforcement learning lets it practice: try many solutions, keep what works, and discover strategies that suit its own way of thinking.',
      body: `
<h2>The textbook analogy</h2>
<p>Think of how a school textbook teaches:</p>
<ul>
<li><strong>Exposition</strong>, the explanatory text you read for background knowledge, is like <span class="tag" data-part="1">pretraining</span>.</li>
<li><strong>Worked examples</strong>, where an expert solves a problem step by step and you follow along, are like <span class="tag" data-part="2">SFT</span>.</li>
<li><strong>Practice problems</strong>, just a question with the final answer in the back of the book, are like <span class="tag" data-part="3">reinforcement learning</span>. You have to find your own way to the answer.</li>
</ul>

<h2>Why imitation isn't enough</h2>
<p>The Emily problem from step 9 can be solved in many ways: setting up an equation, reasoning in words, jumping straight to the answer. A labeler writing the "ideal" solution can't know which one is easiest for the model. A step that's trivial for a person may be a big leap for the model, and something the model finds easy may be spelled out at needless length. Human and model cognition differ, so it's better to let the model find what works for itself.</p>

<h2>How it works</h2>
<ol>
<li>Take a problem with a known answer.</li>
<li>Have the model generate many independent attempts. Some reach $3; some don't.</li>
<li>Check each final answer automatically.</li>
<li>Train on the attempts that got it right, so the reasoning that worked becomes more likely next time.</li>
</ol>
<p>Repeat this across thousands of problems in math, code and other areas where answers can be checked, and the model gradually discovers solution strategies that suit it. Nobody writes those solutions. SFT is still useful as a starting point that gets the model close; RL then dials it in.</p>

<div data-demo="rlSim"></div>

<p>At the time of the lecture, pretraining and SFT were well established, while RL for LLMs was the new frontier: still being worked out, with many details kept private by the labs.</p>
`,
      takeaways: [
        'RL is trial and error: try, check, reinforce what worked.',
        'It works best where answers can be checked automatically, like math and code.'
      ],
      terms: [
        ['Reinforcement learning (RL)', 'Training by trial and error: the model makes attempts, they\'re scored, and successful behavior is reinforced.'],
        ['Verifiable domain', 'A task where answers can be checked automatically, like math with a known answer or code with tests.'],
        ['Rollout', 'One complete attempt the model generates for a problem during RL.'],
        ['Reward', 'The score an attempt receives, for example 1 for a correct final answer and 0 otherwise.']
      ],
      quiz: [
        {
          q: 'In the textbook analogy, practice problems correspond to which stage?',
          options: ['Pretraining', 'SFT', 'Reinforcement learning'],
          answer: 2,
          why: 'Practice problems give you the question and the final answer, not the method, just like RL.'
        },
        {
          q: 'Why not train only on human-written solutions?',
          options: ['Human solutions are usually wrong', 'People can\'t know which reasoning steps are easy or hard for the model; RL lets it find what works for itself', 'It\'s too expensive to store them'],
          answer: 1,
          why: 'Model cognition differs from ours. A solution that\'s natural for a person may not be the best path for the model.'
        },
        {
          q: 'In RL on math problems, how do we decide which attempts to reinforce?',
          options: ['Compare each attempt\'s final answer with the known correct answer', 'A person reads every attempt', 'Always reinforce the longest attempts'],
          answer: 0,
          why: 'In verifiable domains the check is automatic, so millions of attempts can be scored without people.'
        }
      ]
    },

    {
      id: 'thinking-models',
      part: 3,
      title: 'Thinking models: DeepSeek-R1 and AlphaGo',
      start: '02:27:47',
      end: '02:48:26',
      chapters: [['DeepSeek-R1', '02:27:47'], ['AlphaGo', '02:42:07']],
      lead: 'Run RL at scale and models learn to think: longer answers that check, backtrack and retry. And unlike imitation, RL can go beyond human performance.',
      body: `
<h2>DeepSeek-R1 made RL public</h2>
<p>In January 2025, DeepSeek published the <a href="https://arxiv.org/abs/2501.12948" target="_blank" rel="noopener">DeepSeek-R1 paper</a>, which described RL finetuning of LLMs at scale, in the open. Two of its charts tell the story:</p>
<ul>
<li>As RL training goes on, accuracy on AIME math competition problems climbs steadily. For the RL-only model, R1-Zero, the paper reports a rise from about 16% to 71%.</li>
<li>At the same time, without anyone asking for it, the model's answers get much longer.</li>
</ul>

<h2>What the extra tokens are for</h2>
<p>Read the long answers and you see the model re-read the problem, try another approach, check its work and backtrack, writing things like "wait, let me re-evaluate". These <strong>chains of thought</strong> weren't written by anyone. They emerged because thinking this way leads to correct answers more often. The paper even highlights an "aha moment" where the model catches its own mistake mid-solution.</p>
<p>These are <strong>thinking models</strong>, also called reasoning models. In early 2025 you could try DeepSeek-R1 on chat.deepseek.com with "DeepThink" turned on, or through hosts like Together AI, since its weights are open. OpenAI's o1 and o3-mini were thinking models too; OpenAI showed only summaries of their reasoning, probably to make it harder for others to copy (distill) it. GPT-4o, by comparison, was mostly an SFT model.</p>
<p>Karpathy's advice at the time: a regular model handles most everyday questions, about 80 to 90% of his own use. Reach for a thinking model for hard math, code and multi-step reasoning, and accept that it takes longer.</p>

<h2>AlphaGo: past the human ceiling</h2>
<p>DeepMind's Go programs show where RL can lead. A version trained to imitate expert human games gets strong, then levels off below the very best players. A version trained with RL, playing against itself and reinforcing moves that win, keeps improving and surpasses top humans, including Lee Sedol.</p>

<div data-demo="alphaChart"></div>

<p>The famous example is <strong>Move 37</strong> in the 2016 match against Lee Sedol: a move a human professional would play with roughly a 1 in 10,000 chance. Experts first took it for a mistake; it turned out to be brilliant. RL found a strategy no human would have chosen.</p>
<p>The open question for LLMs is what their Move 37 looks like. With enough varied practice problems, RL might discover new ways of reasoning, new analogies, maybe even ways of thinking that don't map neatly onto human language.</p>
`,
      takeaways: [
        'Thinking models are RL-trained. They spend more tokens, and time, to get hard problems right.',
        'RL is how models may go beyond imitating us; AlphaGo\'s Move 37 is the precedent.'
      ],
      terms: [
        ['Thinking model', 'A model trained with RL to reason at length before answering, such as DeepSeek-R1 or OpenAI\'s o1. Also called a reasoning model.'],
        ['AIME', 'A hard high-school math competition, used as a benchmark for reasoning models.'],
        ['Distillation', 'Training a smaller or different model to imitate another model\'s outputs.'],
        ['Open weights', 'A model whose parameters are published, so anyone can download and run it.'],
        ['Move 37', 'AlphaGo\'s surprising, brilliant move against Lee Sedol in 2016; a symbol of RL discovering strategies humans wouldn\'t.']
      ],
      quiz: [
        {
          q: 'What surprising behavior emerged in DeepSeek-R1 during RL?',
          options: ['It stopped using tokens', 'Longer answers with self-checking and backtracking that nobody explicitly programmed', 'It learned to browse the web'],
          answer: 1,
          why: 'Only correctness was rewarded. Thinking out loud emerged because it led to more correct answers.'
        },
        {
          q: 'Why could RL surpass human performance when imitation can\'t?',
          options: ['RL optimizes for the outcome and can discover strategies no human uses; imitation tops out near its examples', 'RL simply uses more GPUs', 'Imitation forgets the rules of the game'],
          answer: 0,
          why: 'Imitation copies human play, ceiling included. RL is free to find moves, like Move 37, that humans wouldn\'t make.'
        },
        {
          q: 'When should you reach for a thinking model?',
          options: ['For quick, simple factual questions', 'For casual chat', 'For hard math, coding and multi-step reasoning'],
          answer: 2,
          why: 'Thinking takes time. It pays off on hard problems; for everyday questions a regular model is usually enough.'
        }
      ]
    },

    {
      id: 'rlhf',
      part: 3,
      title: 'RLHF: learning from human preferences',
      start: '02:48:26',
      end: '03:09:39',
      chapters: [['Reinforcement learning from human feedback (RLHF)', '02:48:26']],
      lead: 'For tasks with no answer key, like jokes, poems and summaries, RLHF trains a reward model to imitate human preferences, then runs RL against it. It helps, but it can\'t run for long before the model games the reward model.',
      body: `
<h2>When there's no answer key</h2>
<p>RL needs a score for each attempt. That's easy for math, but what about "Write a joke about pelicans"? There's no answer key for funny. You could ask people to score every attempt, but the numbers don't work: around a thousand training updates, each with about a thousand prompts and a thousand attempts per prompt, adds up to roughly a billion human judgments.</p>

<h2>Train a stand-in for people</h2>
<p><strong>RLHF</strong> (reinforcement learning from human feedback) solves this with a separate neural network, a <strong>reward model</strong>, that learns to imitate human judgment:</p>
<ol>
<li>Show a person several attempts for the same prompt, say 5 jokes, and ask them to rank them from best to worst. Ranking is much easier than assigning scores.</li>
<li>Train the reward model so its scores put the jokes in the same order the person did.</li>
<li>Run RL on the language model, using the reward model's score in place of a human.</li>
</ol>

<div data-demo="rlhfRank"></div>

<h2>The upside</h2>
<p>RLHF makes RL possible in any domain, including writing, summarizing and conversation, and it improves models in practice; GPT-4o went through it. It also exploits the <strong>discriminator-generator gap</strong>: for people, judging is much easier than creating. You can rank five jokes without being a comedian.</p>

<h2>The catch</h2>
<p>The reward model is only a lossy simulation of people, and RL is extremely good at finding exactly where a scorer is wrong. Run RLHF long enough and the model discovers nonsense the reward model loves, like "the the the the the" earning a perfect score as a pelican joke. You can patch that case by adding it to the reward model's training with a low score, but there are infinitely many others.</p>
<p>So in practice RLHF runs for a few hundred updates and then stops. Karpathy's view: it isn't RL in the magical, run-it-forever sense. Think of it as a final polish, a little finetuning that makes answers nicer.</p>
`,
      takeaways: [
        'RLHF extends RL to subjective tasks by learning a stand-in for human judgment.',
        'It\'s a polish, not an engine for open-ended improvement: run it too long and the model games the reward model.'
      ],
      terms: [
        ['RLHF', 'Reinforcement learning from human feedback: RL against a reward model trained on human preference rankings.'],
        ['Reward model', 'A separate neural network trained to predict how a person would score or rank a response.'],
        ['Unverifiable domain', 'A task without an objectively checkable answer, like humor, style or summaries.'],
        ['Discriminator-generator gap', 'The observation that judging a piece of work is much easier than producing it.'],
        ['Reward hacking', 'When RL finds outputs that score highly with the reward model without actually being good.']
      ],
      quiz: [
        {
          q: 'What does the reward model do?',
          options: ['It pays the labelers', 'It predicts human preference scores, so RL doesn\'t need a person to judge every attempt', 'It checks math answers against an answer key'],
          answer: 1,
          why: 'It\'s a neural network trained on human rankings, used as an automatic, tireless stand-in for human judges.'
        },
        {
          q: 'Why isn\'t RLHF run for thousands of steps?',
          options: ['The model learns to exploit the reward model\'s blind spots, for example with nonsense that scores high', 'It runs out of jokes', 'The model gets too funny'],
          answer: 0,
          why: 'The reward model is only an approximation of people. Optimize against it for too long and RL finds its weaknesses.'
        },
        {
          q: 'Why ask people to rank answers instead of writing the perfect one?',
          options: ['Rankings take less storage', 'People can\'t write', 'Judging is much easier than creating: the discriminator-generator gap'],
          answer: 2,
          why: 'Anyone can say which of five jokes is funniest. Writing the funniest joke is much harder.'
        }
      ]
    },

    /* ───────────────────────── PART 4 ───────────────────────── */
    {
      id: 'whats-next',
      part: 4,
      title: 'What\'s next, and where to find LLMs',
      start: '03:09:39',
      end: '03:21:46',
      chapters: [['Preview of things to come', '03:09:39'], ['Keeping track of LLMs', '03:15:15'], ['Where to find LLMs', '03:18:34']],
      lead: 'Karpathy\'s outlook as of February 2025, plus where he suggests following the field and where to run models yourself.',
      body: `
<h2>What's coming</h2>
<ul>
<li><strong>Multimodality.</strong> Models that natively handle audio, images and video as well as text, by tokenizing them too (slices of an audio spectrogram, patches of an image) and processing them like any other tokens.</li>
<li><strong>Agents.</strong> Models carrying out long tasks over minutes or hours, checking and correcting their own work, with people supervising, a bit like supervisors in an automated factory.</li>
<li><strong>Pervasive, invisible AI.</strong> Models built into the tools and software you already use.</li>
<li><strong>Computer use.</strong> Models that operate a computer with keyboard and mouse actions, like OpenAI's Operator.</li>
<li><strong>Test-time training.</strong> Today a model's parameters are frozen once training ends. At use time the only learning is in-context learning, and the context window is a limited resource. Long-running, multimodal tasks will probably need new ideas here.</li>
</ul>

<h2>Keeping track</h2>
<ul>
<li><a href="https://lmarena.ai/" target="_blank" rel="noopener">LM Arena</a>: a leaderboard built from blind, side-by-side comparisons by people. Use it as a first pass, then try models yourself.</li>
<li><a href="https://buttondown.com/ainews" target="_blank" rel="noopener">AI News</a>: a very comprehensive newsletter covering each day's developments.</li>
<li>X (formerly Twitter), where much of the AI conversation happens.</li>
</ul>

<h2>Where to find models</h2>
<ul>
<li><strong>Proprietary models:</strong> on the provider's own site or app, such as ChatGPT or Gemini.</li>
<li><strong>Open-weights models</strong> such as DeepSeek or Llama: inference providers like the <a href="https://api.together.xyz/playground" target="_blank" rel="noopener">Together AI playground</a>.</li>
<li><strong>Base models:</strong> <a href="https://app.hyperbolic.xyz/" target="_blank" rel="noopener">Hyperbolic</a> serves the Llama 3.1 base model.</li>
<li><strong>On your own computer:</strong> <a href="https://lmstudio.ai/" target="_blank" rel="noopener">LM Studio</a> runs smaller models locally, usually distilled and quantized (compressed) versions.</li>
</ul>

<aside class="note"><p><strong>Since the lecture:</strong> it was recorded in February 2025, and the specific models and rankings have moved on, so check a current leaderboard for today's leaders. The training pipeline and mental models in this tutorial still apply.</p></aside>
`,
      takeaways: [
        'Multimodality, agents and computer use were the next wave.',
        'Follow LM Arena, AI News and X; run open models through providers like Together AI, or locally with LM Studio.'
      ],
      terms: [
        ['Multimodal', 'Handling several kinds of input and output, such as text, audio, images and video, in one model.'],
        ['Agent', 'A model that carries out a multi-step task on its own, using tools and checking its work.'],
        ['Test-time training', 'The idea of models updating their parameters while in use, rather than only during training.'],
        ['Quantization', 'Storing a model\'s parameters with fewer bits so it\'s smaller and faster, at a small cost in quality.']
      ],
      quiz: [
        {
          q: 'How can a model handle audio or images, according to the lecture?',
          options: ['A person transcribes them first', 'It can\'t; LLMs are text only', 'They\'re tokenized too, as spectrogram slices or image patches, and processed like text tokens'],
          answer: 2,
          why: 'Once anything is turned into tokens, the same next-token machinery applies.'
        },
        {
          q: 'What\'s a sensible first stop for comparing current models?',
          options: ['A leaderboard of blind human comparisons like LM Arena, then trying models yourself', 'Asking each model whether it\'s the best', 'Picking whichever model has the most parameters'],
          answer: 0,
          why: 'Rankings give you a first pass; your own tasks are the real test.'
        }
      ]
    },

    {
      id: 'summary',
      part: 4,
      title: 'The grand summary',
      start: '03:21:46',
      end: '03:31:23',
      chapters: [['Grand summary', '03:21:46']],
      lead: 'What actually happens when you type a message into ChatGPT and press Enter, and how to think about what\'s answering you.',
      body: `
<div data-demo="summaryFlow"></div>

<ol>
<li>Your message is wrapped in the conversation format with special tokens, then <strong>tokenized</strong> into a list of token IDs.</li>
<li>A fixed neural network reads the whole sequence and predicts probabilities for the next token. One token is <strong>sampled</strong> and appended, over and over, until the reply is finished.</li>
<li>Its <strong>knowledge</strong> comes from pretraining on internet text: a vague, lossy recollection of the web.</li>
<li>Its <strong>behavior</strong> as an assistant comes from SFT. With a model like GPT-4o, you're talking to a statistical simulation of a human labeler following the company's instructions.</li>
<li>With a <strong>thinking model</strong> there's more: RL let it discover its own reasoning strategies through practice. That's the beginning of thinking that isn't pure imitation, so far strongest in verifiable areas like math and code.</li>
<li>Throughout, it has a fixed amount of computation per token, sees tokens rather than letters, and has Swiss cheese capabilities.</li>
</ol>

<h2>How to use LLMs well</h2>
<ul>
<li>Treat them as tools: great for first drafts, explanations and ideas. Check their work, especially when it matters.</li>
<li>Put important information into the context window, for example by pasting the document, instead of relying on the model's memory.</li>
<li>Let them use tools: search for facts, code for math and counting.</li>
<li>Use a thinking model for hard reasoning and a regular model for quick everyday questions.</li>
<li>Be wary of confident answers about obscure facts. Ask for sources, or use search.</li>
</ul>
`,
      takeaways: [
        'An LLM is pretraining (knowledge) plus SFT (an assistant persona) plus, for thinking models, RL (reasoning).',
        'Use LLMs as powerful but fallible tools: give them context, let them use tools, and verify.'
      ],
      terms: [],
      quiz: [
        {
          q: 'Which order are the training stages in?',
          options: ['SFT, then pretraining, then RL', 'Pretraining, then SFT, then RL', 'RL, then SFT, then pretraining'],
          answer: 1,
          why: 'First read the internet (pretraining), then imitate experts (SFT), then practice (RL).'
        },
        {
          q: 'What\'s the most reliable way to get an accurate summary of a long article?',
          options: ['Ask the model to recall the article from memory', 'Ask a base model', 'Paste the article into the prompt, then ask'],
          answer: 2,
          why: 'Text in the context window is working memory. Recall from the parameters is vague and lossy.'
        },
        {
          q: '"You\'re talking to a simulation of a human labeler" best describes which kind of model?',
          options: ['An SFT-trained assistant like GPT-4o', 'A base model', 'AlphaGo'],
          answer: 0,
          why: 'SFT assistants imitate labelers\' ideal answers. Base models simulate internet documents, and AlphaGo plays Go.'
        },
        {
          q: 'A model gets an olympiad math problem right, then says 9.11 > 9.9. What\'s the best takeaway?',
          options: ['The olympiad answer must have been copied', 'Its abilities are jagged, so verify its work even on easy questions', 'It\'s broken; stop using it'],
          answer: 1,
          why: 'Swiss cheese: excellent across most of the surface, with holes in unexpected places.'
        }
      ]
    }
  ]
};
