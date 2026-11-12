#!/usr/bin/env python3
"""Clean a generated question bank and give every question a CEFR-style level.

The generator scripts next to this file write banks without the `level` field
the app's level filter needs. This turns such a bank into one the app can use:

    # vocabulary: level comes from the word's rank in the frequency list
    python3 add_levels.py words German/CommonWords.json \\
        --wordlist German/common_words_german.csv -o ../../quiz/German/CommonWords.json

    # fill-in-the-blank sentences: level comes from sentence length
    python3 add_levels.py sentences German/CommonSentences.json \\
        -o ../../quiz/German/CommonSentences.json

`--keep FILE` puts the questions of an existing bank first and skips generated
questions that repeat them, so hand-written questions survive a rebuild.

The output is deterministic for a given input: nothing here is random.

How levels are assigned
-----------------------
words      The word list is ordered most-frequent first. Its four quarters
           become A1, A2, B1, B2. A question is levelled by the foreign word it
           is about, whichever direction it asks in.
sentences  Sentences are sorted by word count, shortest first, and split into
           four equal groups A1..B2. Length is a rough stand-in for difficulty,
           not a judgement of grammar.

Cleaning
--------
- A question whose text repeats an earlier one is dropped. Repeats come from
  words listed twice in the source list and are ambiguous as quiz items.
- A question with two identical choices gets the repeated wrong choice
  replaced by another word from the bank.
- A sentence that is nothing but the blank is dropped.
"""
import argparse
import csv
import json
import sys

LEVELS = ['A1', 'A2', 'B1', 'B2']
BLANK = '------'


def quarter(position, total):
    """Level for the item at zero-based `position` among `total` ordered items."""
    return LEVELS[min(position * len(LEVELS) // total, len(LEVELS) - 1)]


def dedupe(questions, seen=None):
    seen = set() if seen is None else seen
    out = []
    for q in questions:
        key = q['question'].strip()   # case matters: German 'sie' and 'Sie' are different words
        if key in seen:
            continue
        seen.add(key)
        out.append(q)
    return out


def fix_repeated_choices(questions):
    """Replace wrong choices that repeat another choice. Returns how many were fixed."""
    pool = []
    for q in questions:
        pool.append(q['choices'][q['answer']])
    fixed = 0
    for n, q in enumerate(questions):
        choices = q['choices']
        used = set()
        # The correct answer keeps its text; visit it first so a wrong choice that
        # repeats it is the one replaced.
        order = [q['answer']] + [i for i in range(len(choices)) if i != q['answer']]
        for i in order:
            if choices[i].strip().lower() not in used:
                used.add(choices[i].strip().lower())
                continue
            step = 0
            while True:
                candidate = pool[(n * 7 + i * 13 + step) % len(pool)]
                step += 1
                if candidate.strip().lower() not in used:
                    break
            choices[i] = candidate
            used.add(candidate.strip().lower())
            fixed += 1
    return fixed


def level_words(questions, wordlist_path, column):
    """Level each question by the frequency rank of the foreign word it is about."""
    rank = {}
    with open(wordlist_path, encoding='utf-8') as f:
        rows = [r for r in csv.reader(f) if len(r) > column]
    for i, row in enumerate(rows):
        rank.setdefault(row[column].strip().lower(), i)   # first (most frequent) listing wins
    unknown = 0
    for q in questions:
        candidates = [q['question'], q['choices'][q['answer']]]
        ranks = [rank[c.strip().lower()] for c in candidates if c.strip().lower() in rank]
        if ranks:
            q['level'] = quarter(min(ranks), len(rows))
        else:
            q['level'] = LEVELS[-1]
            unknown += 1
    return unknown


def level_sentences(questions):
    questions = [q for q in questions if q['question'].replace(BLANK, '').strip()]
    by_length = sorted(range(len(questions)), key=lambda i: (len(questions[i]['question'].split()), i))
    for position, i in enumerate(by_length):
        questions[i]['level'] = quarter(position, len(questions))
    return questions


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('kind', choices=['words', 'sentences'])
    p.add_argument('bank', help='generated bank without levels')
    p.add_argument('-o', '--output', required=True)
    p.add_argument('--wordlist', help='frequency-ordered CSV (words only)')
    p.add_argument('--column', type=int, default=1, help='CSV column of the foreign word (default 1)')
    p.add_argument('--keep', help='existing bank whose questions go first, unchanged')
    args = p.parse_args(argv)

    with open(args.bank, encoding='utf-8') as f:
        questions = json.load(f)
    kept = []
    if args.keep:
        with open(args.keep, encoding='utf-8') as f:
            kept = json.load(f)
    total_in = len(questions)

    seen = set(q['question'].strip() for q in kept)
    questions = dedupe(questions, seen)
    if args.kind == 'words':
        if not args.wordlist:
            p.error('words needs --wordlist')
        fixed = fix_repeated_choices(questions)
        unknown = level_words(questions, args.wordlist, args.column)
    else:
        questions = level_sentences(questions)
        fixed = fix_repeated_choices(questions)
        unknown = 0

    out = kept + questions
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write('\n')

    counts = {l: sum(1 for q in out if q.get('level') == l) for l in LEVELS}
    print('%s: %d in, %d kept from existing bank, %d written (%d dropped, %d choices fixed, %d not in word list)'
          % (args.output, total_in, len(kept), len(out), total_in - len(questions), fixed, unknown), file=sys.stderr)
    print('  levels: ' + ', '.join('%s %d' % kv for kv in counts.items()), file=sys.stderr)


if __name__ == '__main__':
    main()
