## Kids Multiplication Game

### Overview

The kid's avatar fights a level boss by doing single digit multiplications math question. 

#### Game Play:

- There will be three levels, Easy, Medium, Hard. Kids can choose which level to play.
- In each level consists of multiple rounds of play, and finishes when the HP of either the player or the level boss reaches 0.
- On each round, one single digit multiplication question is presented. If the input answer is correct, the level boss looses 1 HP. If incorrect, the avatar looses 1 HP
- As the level difficulty increases, the avatar's max HP decreases and the level boss's max HP increases. This is stored in a data file that I can customize.

#### Question selection

- Each multiplication question (single digit multiplication) is associated with a normalized difficulty level. For example, 1 \times 1 has difficulty 0 and 8 \time 7 has difficulty 0.9 
- For start, all multiplication by 1 has difficulty 0, multiplication by 2 has difficulty 0.1. multiplication by 3, 4, and 5 has difficuties 0.3. All square numbers have difficulty 0.5, and the rest have difficulties of 0.8.
- Question for each level is selected based on the their difficulty. Easy level starts at difficulty 0, Medium at difficulty 0.3, and Hard at 0.5
- Search difficulty moves in steps of 0.1.
- If two questions at the current difficulty are answered correctly, or if the only question at that difficulty is answered correctly, raise the search by 0.1. If no question exists there, keep raising by 0.1 until a question is found.
- If two questions at the current difficulty are answered incorrectly, or if the only question at that difficulty is answered incorrectly, lower the search to the closest difficulty below that still has a question.
- One correct answer and one incorrect answer at the same difficulty leave the search where it is. The counts start over when the search difficulty changes.
- If no higher difficulty has a question, the search stays put. If no lower difficulty has a question, the search stays put.
- Devise a simple mechanism to dynamically update the difficulty level of each multiplication fact based on the kids' correct of incorrect answer for each question in the game play.
- All parameters can be modified by the user.

#### Characters:

Avatar: (kids can choose different avatar and the list can be expanded later)

- Pengy, a little purple penguin
- Marshmello, a grey baby koala

Level boss: 

- Easy: A pig
- Medium: A  killer whale
- Hard: A big gorilla

#### Screen layout:

- Multiplication question in the middle, avatar on the left and level boss on the right.
- HP value of each character is shown on the top.
- An on-screen number pad is present below the multiplication question for the player to input the answer.

#### Game Animation:

- When a correct answer is entered:
  - The avatar makes a face to the level boss by sticking out its tongue.
  - The level boss cries
- When an incorrect answer is entered:
  - The avatar cries
  - The level boss laughs
- When a level is cleared (level boss HP reaches zero):
  - The avatar laughs and jumps
  - The level boss fell to the gound and crys hard with a lot of tears
  - "You win!" text
- When a level fails (avatar HP reaches zero):
  - The avatar lays on the ground and crys
  - The level boss laughs and jumps.
- At the end of each level, there will be a play again button, a "play easier level" and a "play harder level" button (greyed on if already at the easy/hard level).

#### Difficulty table on each tablet

Each girl has her own difficulty table on her tablet. The shared file only supplies the starting guess, copied in the first time the app runs. After that, her table is the one the game uses. Play never changes the shared file.

Difficulty is a number on a 0.1 grid, from 0 to 0.9.

Each fact (for example 3×4 and 4×3 are separate) stores:

- difficulty: a multiple of 0.1
- streak: consecutive correct answers
- status: unseen, learning, or mastered
- correct count and wrong count

Seed guess, first launch only:

- If either factor is 1, including 1×1: 0
- Otherwise if the two factors are equal: 0.5
- Otherwise if either factor is 2: 0.1
- Otherwise if either factor is 3, 4, or 5: 0.3
- Otherwise: 0.8

Facts run from 1×1 through 9×9. 8×7 starts at 0.8.

During a level the difficulty numbers stay frozen. Each answer still updates that fact immediately:

- Correct: streak increases by 1. Status becomes mastered when the streak reaches 3, otherwise learning.
- Wrong: streak returns to 0. Status becomes learning.

The next question is chosen with the search rule above, using these frozen difficulties.

The table updates only when a level finishes, meaning the avatar or the boss has reached 0 HP. Leaving early keeps the streak and status from answers already given, and leaves difficulties unchanged.

Update rule, applied once at the end of a level. It uses each fact’s own streak. It does not score the fight as a group.

Use the streak that fact has when the level ends, and apply one move:

- Streak 0 or 1: difficulty stays the same.
- Streak 2: difficulty decreases by 0.2.
- Streak 3: difficulty decreases by 0.3.

That move happens once for that streak. The next level does not move it again while the streak stays 2, or stays 3. If one level ends at streak 2 (−0.2) and a later level reaches streak 3, the later level decreases difficulty by another 0.3.

If the streak reaches 3 in the same level it passed through 2, only the streak-3 move applies (−0.3). A wrong answer sets that fact’s streak back to 0 and does not raise its difficulty. After a reset, a new streak of 2 or 3 can move it again.

Difficulty stays on the 0.1 grid, from 0 to 0.9. A decrease that would pass 0 stops at 0. The next level uses the new table.

These can be edited: the starting guess, the streak moves (0, −0.2, −0.3), and each level’s starting difficulty and HP.

