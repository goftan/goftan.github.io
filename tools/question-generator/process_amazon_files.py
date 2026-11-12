import json, csv, random, re
from itertools import permutations


def process_amazon_files(input, output, words_input, index):
    words = []

    with open(words_input) as f:
        reader = csv.reader(f, delimiter=',')
        for row in reader:
            words.append(row[index])

    with open(input, "r") as f:
        amazon_data = []
        for l in f.readlines():
            row = json.loads(l)
            amazon_data.append([row['intent'], row['utt'], row['annot_utt']])

        data = []
        perm = list(permutations([0, 1, 2, 3]))
        for r in amazon_data:
            ind = [i, j, k] = random.sample(range(0, len(words) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            cnt_g = 0

            sentence_annot = r[2]
            # sentence = re.sub("\[[^]]*\]", lambda x: x.group(0).replace(',', ''), Variable)
            # sentence = re.sub(r"\[[^]]*\]", "-", sentence)
            sentence_annot_found = re.findall("\[[^]]*\]", sentence_annot)
            res = []
            for entity in sentence_annot_found:
                res.append(entity[entity.index(':') + 1:-1].strip())
            # print(res)
            # sentence = re.sub("\[[^]]*\]", lambda x: x.group(0), sentence)
            # print(sentence_annot
            if len(res) > 0:
                for i in perm[random.randint(0, len(perm) - 1)]:
                    if i == 3:
                        choices.append(res[0])
                        answer = cnt
                    else:
                        choices.append(words[ind[i]])
                    cnt = cnt + 1
                data.append({
                    "question": r[1].replace(res[0], "------"),
                    "choices": choices,
                    "answer": answer,
                    "type": "sentence",
                    "intent": r[0][r[0].index('_') + 1:],
                    "extra": "Fill in the blank:"
                })
                if len(data) == 501:
                    break
                cnt_g = cnt_g + 1
        with open(output, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


process_amazon_files('Spanish/es-ES.jsonl', 'Spanish/CommonSentences.json', 'Spanish/common_words_spanish.csv', 1)
process_amazon_files('Korean/ko-KR.jsonl', 'Korean/CommonSentences.json', 'Korean/common_words_korean.csv', 1)
process_amazon_files('German/de-DE.jsonl', 'German/CommonSentences.json', 'German/common_words_german.csv', 1)
process_amazon_files('Persian/fa-IR.jsonl', 'Persian/CommonSentences.json', 'Persian/common_words_persian.csv', 0)
process_amazon_files('Turkish/tr-TR.jsonl', 'Turkish/CommonSentences.json', 'Turkish/common_words_turkish.csv', 1)
process_amazon_files('Arabic/ar-SA.jsonl', 'Arabic/CommonSentences.json', 'Arabic/common_words_arabic.csv', 1)
process_amazon_files('English/en-US.jsonl', 'English/CommonSentences.json', 'English/common_words_english.csv', 1)
