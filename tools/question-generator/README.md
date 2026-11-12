# Question generator

Python scripts that built the original question banks in `quiz/<Language>/`
from vocabulary lists. They were a separate repository
(`rostam/generate_questions_for_quiz`) and live here now, next to the data they
produce.

## Read this first

**Do not copy raw generator output over `quiz/`.** The banks in `quiz/` have
since been edited by hand: every question there carries a `level` field
(`A1` … `B2`) that the app's level filter uses, and these scripts do not write
one. Generating a file and copying it across would drop the levels for that
topic. Pass the output through `add_levels.py` (below) first.

The scripts also pick wrong answers at random, so two runs never give the same
file.

## Scripts

Run these from this directory; they read and write paths relative to it.

| Script | Reads | Writes |
| --- | --- | --- |
| `generate_questions_for_quiz.py` | `<Lang>/common_words_<lang>.csv` | `<Lang>/CommonWords.json` for Korean, Spanish, German |
| `generate_antonyms.py` | `<Lang>/antonyms.csv` | `<Lang>/Antonyms.json` for German, Spanish, Korean |
| `generate_numbers_questions.py` | `Korean/*KoreanNumbers1_100.csv` | `Korean/Numbers.json` |
| `process_amazon_files.py` | `<Lang>/<locale>.jsonl` (see below) | `<Lang>/CommonSentences.json` |
| `Persian/main3.py` (run inside `Persian/`) | the CSV files in `Persian/` | all Persian banks |

The other files under `Persian/` and `German/` are one-off preparation scripts
that produced the CSV inputs; `Persian/main.py` and `main2.py` are earlier
versions of `main3.py`.

```bash
python3 generate_questions_for_quiz.py
cd Persian && python3 main3.py
```

Standard library only. Generated `.json` files are git-ignored here.

## Adding levels

`add_levels.py` turns a generated bank into one the app can use: it drops
repeated questions, repairs questions with two identical choices and gives
every question a level. Vocabulary is levelled by frequency rank in the word
list, sentences by length. `--keep` preserves the questions of the bank already
in `quiz/`. The German word and sentence banks were built this way:

```bash
python3 add_levels.py words German/CommonWords.json \
    --wordlist German/common_words_german.csv \
    --keep ../../quiz/German/CommonWords.json -o ../../quiz/German/CommonWords.json
python3 add_levels.py sentences German/CommonSentences.json \
    --keep ../../quiz/German/CommonSentences.json -o ../../quiz/German/CommonSentences.json
```

Run `python3 add_levels.py --help` for the details of how levels are assigned.

## Sentence data is not included

`process_amazon_files.py` needs the per-locale `.jsonl` files of Amazon's
[MASSIVE](https://github.com/alexa/massive) dataset (`de-DE.jsonl`,
`ko-KR.jsonl`, …, about 12 MB each). They are public and too large to keep in
this repository; download the dataset and place each file in the matching
language folder. `Persian/amazon_fa.csv` is the already-extracted Persian
subset, so the Persian scripts run without it.

## Formats

Input CSV, one pair per row:

```
index, native_word, translation
```

Output, a JSON array:

```json
{
  "question": "것",
  "choices": ["To sit down", "Close", "stature,height", "A thing or an object"],
  "answer": 3,
  "type": "translation",
  "intent": "",
  "extra": "The translation of"
}
```

`answer` is the zero-based index into `choices`.
