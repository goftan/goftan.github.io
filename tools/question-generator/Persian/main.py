import csv, random, json, re
from itertools import permutations

words = []
words_english = []

dict_en_fa = {}
dict_fa_en = {}

with open("dict.csv") as f:
    reader = csv.reader(f, delimiter=',')
    for row in reader:
        dict_en_fa[row[1]] = row[0]
        dict_fa_en[row[0]] = row[1]

with open("persian-wikipedia.csv") as f:
    reader = csv.reader(f, delimiter=',')
    for row in reader:
        if int(row[1]) > 2000:
            words.append(row[0])
            if len(row[0]) == 1 and row[0] != "و":
                continue
            if row[0] in dict_en_fa.keys():
                words_english.append(dict_en_fa[row[0]])

arr_w = []
arr_ant_w = []
arr_w_e = []
arr_ant_w_e = []

with open("antonyms.csv", "r") as f:
    reader = csv.reader(f, delimiter=',')
    for row in reader:
        arr_w.append(row[0])
        arr_ant_w.append(row[2])
        arr_w_e.append(row[1])
        arr_ant_w_e.append(row[3])
        words_english.append(row[1])
        words_english.append(row[3])
        dict_en_fa[row[1]] = row[0]
        dict_en_fa[row[3]] = row[2]
        dict_fa_en[row[0]] = row[1]
        dict_fa_en[row[2]] = row[3]

data = []
perm = list(permutations([0, 1, 2, 3]))
with open("prepared_data.csv", "w") as f:
    with open("../words_questions.json", "w") as f2:
        writer = csv.writer(f)
        for w in words:
            if w in dict_en_fa.keys():
                ind = [i, j, k] = random.sample(range(0, len(words) - 1), 3)
                writer.writerow([w, dict_en_fa[w], words[i], words[j], words[k]])
                choices = []
                d = {}
                cnt = 0
                answer = 0
                for i in perm[random.randint(0, len(perm) - 1)]:
                    if i == 3:
                        choices.append(w)
                        answer = cnt
                    else:
                        choices.append(words[ind[i]])
                    cnt = cnt + 1
                data.append({
                    "question": dict_en_fa[w],
                    "choices": choices,
                    "answer": answer,
                    "type": "translate_fa_en",
                    "intent": ""
                })

        for w in words_english:
            if w in dict_fa_en.keys():
                ind = [i, j, k] = random.sample(range(0, len(words_english) - 1), 3)
                writer.writerow([w, dict_fa_en[w], words_english[i], words_english[j], words_english[k]])
                choices = []
                d = {}
                cnt = 0
                answer = 0
                lp = list(perm)[0]
                for i in perm[random.randint(0, len(perm) - 1)]:
                    if i == 3:
                        choices.append(w)
                        answer = cnt
                    else:
                        choices.append(words_english[ind[i]])
                    cnt = cnt + 1

                data.append({
                    "question": dict_fa_en[w],
                    "choices": choices,
                    "answer": answer,
                    "type": "translate_en_fa",
                    "intent": ""
                })

        # random.shuffle(data)
        # data = data[0:400]

        cnt_g = 0
        for a in arr_w:
            ind = [i, j, k] = random.sample(range(0, len(words) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(arr_ant_w[cnt_g])
                    answer = cnt
                else:
                    # print(ind)
                    choices.append(words[ind[i]])
                cnt = cnt + 1
            data.append({
                "question": a,
                "choices": choices,
                "answer": answer,
                "type": "antonym",
                "intent": ""
            })
            cnt_g = cnt_g + 1

        cnt_g = 0
        for a in arr_ant_w:
            ind = [i, j, k] = random.sample(range(0, len(words) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(arr_w[cnt_g])
                    answer = cnt
                else:
                    choices.append(words[ind[i]])
                cnt = cnt + 1
            data.append({
                "question": a,
                "choices": choices,
                "answer": answer,
                "type": "antonym",
                "intent": ""
            })
            cnt_g = cnt_g + 1
        # data = []
        with open("amazon_fa.csv", "r") as f:
            reader = csv.reader(f)
            for r in reader:
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
                    # data.append({
                    #     "question": r[1].replace(res[0], "------"),
                    #     "choices": choices,
                    #     "answer": res[0],
                    #     "type": "sentence",
                    #     "intent": r[0][r[0].index('_') + 1:]
                    # })
                    if len(data) == 501:
                        break
                    cnt_g = cnt_g + 1


        # perm = list(permutations(range(0,len(data))))[random.randint(0,len(data)-1)]
        # perm_data = []
        # for p in perm:
        #     perm_data.append(data[p])

        random.shuffle(data)
        data = random.sample(data, 2000)
        json.dump(data, f2, indent=2, ensure_ascii=False)
