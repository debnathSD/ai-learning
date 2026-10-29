# AI learning

Study notes and interactive tutorials on how modern AI models work, published with GitHub Pages.

**Live site:** https://debnathsd.github.io/ai-learning/

## Tutorials

### [Deep Dive into LLMs like ChatGPT](https://debnathsd.github.io/ai-learning/llm-deep-dive/)

A step-by-step, interactive companion to Andrej Karpathy's lecture
[Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI) (February 2025, 3h 31m).
Fifteen short steps follow the lecture in order, and each one has:

- a plain-language explanation of that part of the lecture
- links that jump straight to the matching timestamps (or play the segment inline)
- an interactive demo where it helps, for example a BPE tokenizer you can train, a tiny
  language model you can sample from, a toy reinforcement learning loop and an RLHF ranking exercise
- key terms, takeaways and a short quiz

| Part | Steps | Lecture |
| --- | --- | --- |
| 1. Pretraining | Data, tokenization, next-token training, inference, GPT-2, base models | 0:00–0:59 |
| 2. Supervised finetuning | Conversation data, hallucinations and tools, tokens to think, jagged intelligence | 0:59–2:07 |
| 3. Reinforcement learning | RL, thinking models (DeepSeek-R1, AlphaGo), RLHF | 2:07–3:09 |
| 4. The big picture | What's next, where to find LLMs, the grand summary | 3:09–3:31 |

Progress, quiz answers and the theme choice are saved in your browser's local storage.

## Run it locally

There's no build step; it's plain HTML, CSS and JavaScript. From the repository root:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/llm-deep-dive/.

## Publishing

GitHub Pages serves the site from the `gh-pages` branch. The
[Publish site](.github/workflows/publish.yml) workflow mirrors `main` to `gh-pages` on every push, so
commit to `main` and the live site updates a minute or two later.

## Structure

```
index.html                 # hub page listing the tutorials
llm-deep-dive/
  index.html               # app shell
  styles.css               # design tokens, layout, components
  favicon.svg
  js/content.js            # all tutorial text: steps, timestamps, terms, quizzes
  js/demos.js              # interactive demos and figures
  js/app.js                # routing, progress, quizzes, player, glossary
```

To edit the tutorial text, change `llm-deep-dive/js/content.js`. A `<div data-demo="name">` inside a
step's `body` mounts the matching demo from `demos.js`.

## Credits

The lecture and its ideas are Andrej Karpathy's; watch it on
[YouTube](https://www.youtube.com/watch?v=7xTGNNLPyMI). These are unofficial study notes written in our own
words, not affiliated with the lecturer. Demos are simplified illustrations; where a chart or sample is
illustrative rather than real data, the page says so.
