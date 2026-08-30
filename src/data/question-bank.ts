import type {
  AudioClip,
  Choice,
  Difficulty,
  Question,
  QuestionPart,
  QuestionUnit,
  Skill,
} from "@/features/test/types";
import { publicAssetPath } from "@/config/app";

const IDS: Choice["id"][] = ["A", "B", "C", "D"];

function choices(...texts: string[]): Choice[] {
  return texts.map((text, index) => ({ id: IDS[index], text }));
}

function clips(unitId: string, lines: Array<[string, string]>): AudioClip[] {
  return lines.map(([speaker, text], index) => ({
    src: publicAssetPath(`/audio/${unitId}-${String(index + 1).padStart(2, "0")}.mp3`),
    speaker,
    text,
  }));
}

function transcript(lines: Array<[string, string]>): string {
  return lines.map(([speaker, text]) => `${speaker}: ${text}`).join("\n");
}

function makeQuestion(
  id: string,
  prompt: string,
  optionTexts: string[],
  correctChoiceId: Choice["id"],
  explanation: string,
  difficulty: Difficulty = "medium",
  skills: Skill[] = ["detail"],
): Question {
  return { id, prompt, choices: choices(...optionTexts), correctChoiceId, explanation, difficulty, skills };
}

const photoData: Array<{
  scene: string;
  alt: string;
  statements: [string, string, string, string];
  answer: Choice["id"];
}> = [
  { scene: "office-window", alt: "A woman standing beside an office window while speaking on a phone.", statements: ["She is adjusting a window blind.", "She is speaking on a mobile phone.", "She is arranging chairs around a table.", "She is writing on a glass board."], answer: "B" },
  { scene: "market-crates", alt: "A vendor arranging fruit in wooden crates at an outdoor market.", statements: ["Some fruit is being placed in crates.", "A customer is weighing a package.", "The market stalls have been closed.", "Several baskets are being carried away."], answer: "A" },
  { scene: "train-platform", alt: "Two travelers looking at a timetable on a train platform.", statements: ["The passengers are boarding a bus.", "A worker is repairing the railway track.", "Two people are checking a schedule.", "The platform is crowded with luggage carts."], answer: "C" },
  { scene: "restaurant-table", alt: "A server setting cutlery on an empty restaurant table.", statements: ["Guests are reading their menus.", "A meal is being served outdoors.", "The dishes are being washed.", "A table is being prepared for customers."], answer: "D" },
  { scene: "warehouse-boxes", alt: "A warehouse employee scanning a label on a stack of boxes.", statements: ["Boxes are being loaded onto a truck.", "An employee is scanning a package.", "Shelves are being painted.", "The floor is being swept."], answer: "B" },
  { scene: "park-bench", alt: "A man reading a newspaper on a bench beside a bicycle.", statements: ["A bicycle is parked near a bench.", "The man is jogging along a path.", "Several newspapers are on the ground.", "The bench is being moved."], answer: "A" },
  { scene: "meeting-room", alt: "Four coworkers looking at a presentation in a bright meeting room.", statements: ["The lights in the room are being replaced.", "Everyone is seated at separate desks.", "A group is watching a presentation.", "Some papers are being filed in a cabinet."], answer: "C" },
  { scene: "bakery-counter", alt: "A baker placing loaves of bread on a display shelf.", statements: ["A customer is paying at the counter.", "Bread is being arranged for display.", "The shelves are completely empty.", "A worker is slicing vegetables."], answer: "B" },
  { scene: "airport-luggage", alt: "Travelers collecting suitcases from an airport baggage carousel.", statements: ["The travelers are checking in at a hotel.", "A plane is taking off behind the terminal.", "Suitcases are being wrapped for shipping.", "People are waiting beside a baggage carousel."], answer: "D" },
];

const photographUnits: QuestionUnit[] = photoData.map((item, index) => {
  const number = String(index + 1).padStart(2, "0");
  const id = `photo-${number}`;
  const lines: Array<[string, string]> = [["Narrator", item.statements.map((text, choiceIndex) => `${IDS[choiceIndex]}. ${text}`).join(" ")]];
  return {
    id,
    section: "listening",
    part: "photographs",
    instruction: "Look at the photograph. Choose the statement that best describes what you see.",
    stimulus: { kind: "image-audio", image: publicAssetPath(`/images/questions/${item.scene}.webp`), alt: item.alt, audio: { clips: clips(id, lines) }, transcript: transcript(lines) },
    questions: [makeQuestion(`${id}-q1`, "Choose the best description.", item.statements, item.answer, `Statement ${item.answer} directly describes the visible action or arrangement.`, "easy", ["listening-comprehension", "detail"])],
  };
});

const responseData: Array<[string, [string, string, string], Choice["id"], string]> = [
  ["When will the revised schedule be ready?", ["By tomorrow afternoon.", "In the conference room.", "Yes, I read it."], "A", "A time expression answers when the schedule will be ready."],
  ["Could you send me the sales figures?", ["The store closes at six.", "Certainly, I’ll email them now.", "The larger size, please."], "B", "The request is appropriately accepted with an offer to email the figures."],
  ["Why was the meeting moved?", ["To the third floor.", "About forty minutes.", "The director’s flight was delayed."], "C", "The delayed flight provides a reason."],
  ["Who is leading the orientation session?", ["Ms. Patel from Human Resources.", "At the main entrance.", "It lasted all morning."], "A", "The response identifies a person."],
  ["Haven’t the invoices been printed yet?", ["The printer is out of paper.", "They cost twenty dollars.", "Across from the bank."], "A", "The printer problem explains why the invoices are not ready."],
  ["Where should I leave this delivery?", ["It arrived yesterday.", "With reception, please.", "I ordered two boxes."], "B", "The response gives a location and recipient."],
  ["Would you prefer tea or coffee?", ["Coffee would be great.", "Yes, it is warm.", "A table for two."], "A", "The speaker selects one of the offered drinks."],
  ["How often is the equipment inspected?", ["By a trained technician.", "Every three months.", "It is in good condition."], "B", "The response provides a frequency."],
  ["Did Marcus approve the new layout?", ["No, he requested one more change.", "Near the elevator.", "It has a modern design."], "A", "The response directly answers the yes-or-no question and adds detail."],
  ["Which train stops near the convention center?", ["Platform seven is crowded.", "The express leaves at noon.", "Take the green line."], "C", "The green line identifies which train to take."],
  ["Can I borrow your conference-room key?", ["I’ll unlock it for you.", "The conference begins Friday.", "A silver key chain."], "A", "The response offers a practical way to grant access."],
  ["Why don’t we order lunch before the webinar?", ["That’s a good idea.", "It was very informative.", "The order number is eight."], "A", "The response agrees with the suggestion."],
  ["How many copies of the brochure do we need?", ["The copy machine is upstairs.", "About two hundred should be enough.", "It explains the new service."], "B", "The response provides a quantity."],
  ["You’ve met our new accountant, haven’t you?", ["The account was closed.", "No, not yet.", "At a networking event."], "B", "The response answers the tag question naturally."],
  ["Where can visitors park after five?", ["In the south lot.", "For about an hour.", "The visitor signed in."], "A", "The response names a parking location."],
  ["Should I reserve the larger training room?", ["Yes, we expect thirty people.", "The trainer arrived early.", "It is on the reservation form."], "A", "The expected attendance supports reserving the larger room."],
  ["What caused the shipment delay?", ["The highway was closed by snow.", "It ships in a wooden crate.", "Two days earlier."], "A", "The highway closure is the cause."],
  ["When does your membership expire?", ["At the fitness center.", "At the end of September.", "I renewed it online."], "B", "The response gives an expiration time."],
  ["Would you mind checking this translation?", ["The check is on the desk.", "Not at all—send it over.", "I speak with clients daily."], "B", "Not at all politely accepts the request."],
  ["Isn’t the maintenance team coming today?", ["They rescheduled for Thursday.", "The machine needs oil.", "A team of four people."], "A", "The rescheduled visit explains the situation."],
  ["Where did you put the signed contract?", ["The client signed yesterday.", "In the blue folder on my desk.", "It is a one-year agreement."], "B", "The response gives the contract’s location."],
];

const responseUnits: QuestionUnit[] = responseData.map(([spokenQuestion, answers, correct, explanation], index) => {
  const id = `response-${String(index + 1).padStart(2, "0")}`;
  const lines: Array<[string, string]> = [["Narrator", `${spokenQuestion} A. ${answers[0]} B. ${answers[1]} C. ${answers[2]}`]];
  return {
    id,
    section: "listening",
    part: "question-response",
    instruction: "Listen to the question and choose the best response.",
    stimulus: { kind: "audio", audio: { clips: clips(id, lines) }, transcript: transcript(lines) },
    questions: [makeQuestion(`${id}-q1`, "Choose the best response.", answers, correct, explanation, "medium", ["listening-comprehension", "detail"])],
  };
});

interface ListeningGroupData {
  lines: Array<[string, string]>;
  questions: Array<[string, [string, string, string, string], Choice["id"], string, Skill]>;
}

const conversationData: ListeningGroupData[] = [
  { lines: [["Woman", "The copier on the second floor keeps jamming. I need forty packets for this afternoon’s workshop."], ["Man", "Facilities is already looking at it. The machine beside reception is working, though."], ["Woman", "Good. I’ll use that one and ask Leo to bring the paper downstairs."]], questions: [["What problem does the woman mention?", ["A printer has no ink.", "A copier is jamming.", "A workshop was canceled.", "A delivery is late."], "B", "She explicitly says the second-floor copier keeps jamming.", "detail"], ["What does the man suggest?", ["Postponing the workshop", "Calling Leo", "Using another machine", "Printing fewer packets"], "C", "He points out that the reception-area machine works.", "inference"], ["What will the woman probably do next?", ["Go downstairs", "Contact Facilities", "Order a copier", "Revise a schedule"], "A", "She says she will use the copier beside reception, which is downstairs.", "inference"]] },
  { lines: [["Man", "I reserved a compact car, but the confirmation says midsize."], ["Woman", "We upgraded you at no charge because compact cars are unavailable today."], ["Man", "That’s fine. Can I return it to the airport branch on Monday?"], ["Woman", "Yes, I’ll update the return location now."]], questions: [["Where are the speakers?", ["At a repair shop", "At a car rental counter", "At an airport gate", "At a hotel desk"], "B", "They discuss a vehicle reservation, upgrade, and return branch.", "inference"], ["Why was the man given a midsize car?", ["He requested more space.", "His flight was delayed.", "Compact cars are unavailable.", "The rate was lower."], "C", "The woman states that compact cars are unavailable.", "detail"], ["What will the woman do?", ["Change the return location", "Inspect the vehicle", "Print a boarding pass", "Call another branch"], "A", "She says she will update the return location.", "detail"]] },
  { lines: [["Woman", "The client approved the homepage, but they want the product photos replaced."], ["Man", "I can finish the edits by Wednesday if the photographer sends the files today."], ["Woman", "I’ll call her now and copy you on the delivery message."]], questions: [["What has the client approved?", ["A homepage", "A product name", "A photo budget", "A delivery schedule"], "A", "The homepage has been approved.", "detail"], ["What does the man need?", ["A client signature", "New image files", "A larger budget", "A design meeting"], "B", "He needs files from the photographer to replace the photos.", "inference"], ["What will the woman probably do next?", ["Edit the homepage", "Meet the client", "Contact the photographer", "Prepare an invoice"], "C", "She says she will call the photographer now.", "detail"]] },
  { lines: [["Man", "Are we still holding the staff picnic at Riverside Park? The forecast says heavy rain."], ["Woman", "I booked the community hall as a backup. It has enough tables and a covered loading area."], ["Man", "Great. I’ll tell the caterer to deliver there instead."]], questions: [["What are the speakers organizing?", ["A sales conference", "A staff picnic", "A charity run", "A training course"], "B", "The man refers to the staff picnic.", "detail"], ["Why might the event location change?", ["The park is closed.", "Attendance increased.", "Heavy rain is expected.", "The caterer is unavailable."], "C", "The forecast predicts heavy rain.", "detail"], ["Who will the man contact?", ["A park manager", "A caterer", "A trainer", "A driver"], "B", "He plans to tell the caterer about the new location.", "detail"]] },
  { lines: [["Woman", "Your annual eye examination is scheduled for ten on Friday, but the doctor has been called to a conference."], ["Man", "Could I come later that afternoon?"], ["Woman", "There’s an opening at three thirty, or Monday morning at nine."], ["Man", "Friday afternoon works best."]], questions: [["Why is the appointment being changed?", ["The doctor will attend a conference.", "The office will close early.", "The patient is traveling.", "The equipment needs repair."], "A", "The doctor has been called to a conference.", "detail"], ["What time does the man choose?", ["Friday at ten", "Friday at three thirty", "Monday at nine", "Monday at three thirty"], "B", "He chooses the offered Friday afternoon time of 3:30.", "detail"], ["Where most likely does the woman work?", ["At an optician’s office", "At a travel agency", "At a university", "At a conference center"], "A", "An annual eye examination and doctor indicate an optician or eye clinic.", "inference"]] },
  { lines: [["Man", "The quarterly report shows that online orders rose twelve percent, but store visits fell."], ["Woman", "Let’s mention the website promotion in the presentation. It may explain the increase."], ["Man", "Agreed. I’ll add that slide before the directors arrive."]], questions: [["What increased by twelve percent?", ["Advertising costs", "Store visits", "Online orders", "Product returns"], "C", "The man states that online orders rose twelve percent.", "detail"], ["What does the woman recommend?", ["Opening another store", "Discussing a promotion", "Changing the report period", "Surveying the directors"], "B", "She recommends mentioning the website promotion.", "detail"], ["What will the man do?", ["Add a presentation slide", "Call the directors", "Review product returns", "Cancel a promotion"], "A", "He says he will add the slide.", "detail"]] },
  { lines: [["Woman", "I’m calling about the desk you delivered yesterday. One drawer won’t close completely."], ["Man", "I’m sorry about that. I can send a technician tomorrow between one and three."], ["Woman", "I’ll be at work then. Could my neighbor let the technician in?"], ["Man", "Certainly. Just add her name to the service request online."]], questions: [["What problem does the woman report?", ["A scratched surface", "A missing chair", "A broken drawer", "A late delivery"], "C", "She says one desk drawer will not close.", "detail"], ["What does the man offer?", ["A full refund", "A technician visit", "A replacement today", "Free assembly"], "B", "He offers to send a technician tomorrow.", "detail"], ["What must the woman do online?", ["Select a new desk", "Pay a service fee", "Choose a time", "Add her neighbor’s name"], "D", "The man tells her to add the neighbor’s name to the request.", "detail"]] },
  { lines: [["Man", "The museum tour begins at eleven, but our group’s bus won’t arrive until eleven fifteen."], ["Woman", "I can ask the guide to start with the garden. Your group could join before everyone enters the gallery."], ["Man", "That would solve the problem. I’ll message the driver with the garden entrance address."]], questions: [["What delay does the man mention?", ["A bus will arrive late.", "A gallery will open late.", "A guide missed a train.", "A garden is closed."], "A", "The group’s bus will arrive after the tour begins.", "detail"], ["What does the woman propose?", ["Refunding the group", "Moving the tour to noon", "Beginning in the garden", "Hiring another driver"], "C", "She suggests starting the tour with the garden.", "detail"], ["What will the man send to the driver?", ["A ticket number", "An entrance address", "A guide’s phone number", "A passenger list"], "B", "He will message the garden entrance address.", "detail"]] },
];

function makeListeningGroups(data: ListeningGroupData[], part: "short-conversations" | "short-talks", prefix: string, instruction: string): QuestionUnit[] {
  return data.map((group, index) => {
    const id = `${prefix}-${String(index + 1).padStart(2, "0")}`;
    return {
      id,
      section: "listening",
      part,
      instruction,
      stimulus: { kind: "audio", audio: { clips: clips(id, group.lines) }, transcript: transcript(group.lines) },
      questions: group.questions.map(([prompt, optionTexts, answer, explanation, skill], questionIndex) => makeQuestion(`${id}-q${questionIndex + 1}`, prompt, optionTexts, answer, explanation, questionIndex === 2 ? "hard" : "medium", ["listening-comprehension", skill])),
    };
  });
}

const talkData: ListeningGroupData[] = [
  { lines: [["Speaker", "Good morning, shoppers. For the next two hours, all winter coats on the second floor are thirty percent off. Loyalty members receive an additional ten percent discount at checkout. Please note that clearance items are excluded, and fitting rooms near the east elevator are temporarily closed for maintenance."]], questions: [["What is being announced?", ["A store sale", "A new elevator", "A loyalty event", "A maintenance job"], "A", "The announcement promotes discounts on winter coats.", "purpose"], ["Who can receive an additional discount?", ["Employees", "Online customers", "Loyalty members", "Maintenance workers"], "C", "Loyalty members receive another ten percent off.", "detail"], ["What is temporarily unavailable?", ["The second floor", "Some fitting rooms", "The checkout area", "The loyalty desk"], "B", "Fitting rooms near the east elevator are closed.", "detail"]] },
  { lines: [["Speaker", "Welcome to the Hartwell Science Center. The planetarium show begins at two o’clock and lasts forty-five minutes. Tickets are included with admission, but seating is limited, so collect a numbered pass from the information desk. Photography is not permitted during the show, though you may take pictures in the exhibition hall."]], questions: [["Where is the announcement heard?", ["At a science center", "At a movie studio", "At a university", "At a photography shop"], "A", "The speaker welcomes visitors to a science center.", "detail"], ["What should visitors collect?", ["A camera permit", "A map", "A numbered pass", "A refund form"], "C", "A numbered pass is needed because seating is limited.", "detail"], ["Where may visitors take photographs?", ["In the planetarium", "At the information desk", "In the exhibition hall", "During the show"], "C", "Photography is allowed in the exhibition hall.", "detail"]] },
  { lines: [["Speaker", "This is a reminder for passengers on Flight 628 to Montreal. Boarding will begin at Gate 14 instead of Gate 9 because of construction in the west concourse. Passengers needing assistance may board at six twenty. All other passengers should remain near the gate until their group number is called."]], questions: [["Why has the gate changed?", ["The flight is delayed.", "Construction is underway.", "The aircraft is larger.", "A gate is crowded."], "B", "Construction in the west concourse caused the change.", "detail"], ["Who may board at six twenty?", ["Passengers needing assistance", "Travelers in group nine", "All Montreal residents", "Construction workers"], "A", "Passengers needing assistance are invited at 6:20.", "detail"], ["What are most passengers asked to do?", ["Check their luggage again", "Go to Gate 9", "Wait for their group number", "Show identification"], "C", "They should remain near the gate until their group is called.", "detail"]] },
  { lines: [["Speaker", "Thank you for calling Northside Dental. Our office is closed for staff training today and will reopen tomorrow at eight thirty. To change an appointment, leave your name, telephone number, and preferred date after the tone. For urgent dental care, call the twenty-four-hour clinic at 555-0186."]], questions: [["Why is the office closed?", ["The dentist is ill.", "Staff are attending training.", "The building has no power.", "It is a public holiday."], "B", "The message states that staff training is taking place.", "detail"], ["What information should callers leave?", ["An insurance number", "A home address", "A preferred appointment date", "A description of payment"], "C", "Callers should leave their preferred date along with contact details.", "detail"], ["What should callers do for urgent care?", ["Visit tomorrow morning", "Send an email", "Call another clinic", "Wait after the tone"], "C", "Urgent patients are directed to a 24-hour clinic.", "detail"]] },
  { lines: [["Speaker", "Before we begin today’s factory tour, please put on the safety glasses provided in the blue bins. Stay inside the yellow walkways and do not touch any machinery. The tour will end at the quality-control laboratory, where you’ll have ten minutes to ask questions. Bags may be stored in the lockers behind you."]], questions: [["What must visitors wear?", ["Protective gloves", "Safety glasses", "A visitor badge", "A laboratory coat"], "B", "Safety glasses are required before the tour.", "detail"], ["Where will the tour finish?", ["At the lockers", "In the cafeteria", "At a blue bin", "In a laboratory"], "D", "The final stop is the quality-control laboratory.", "detail"], ["What may visitors do at the final stop?", ["Ask questions", "Operate machinery", "Collect their bags", "Leave the walkway"], "A", "The speaker allows ten minutes for questions there.", "detail"]] },
  { lines: [["Speaker", "The city library’s mobile app will be unavailable from midnight until five tomorrow morning while we install a security update. During that time, digital books cannot be borrowed or renewed. Items already downloaded will continue to open normally. The main website and all library branches will operate on their regular schedules."]], questions: [["What will be temporarily unavailable?", ["A mobile application", "All library branches", "Downloaded books", "The main website"], "A", "The mobile app will be unavailable during maintenance.", "detail"], ["Why is the service interruption necessary?", ["To add new books", "To install a security update", "To change branch hours", "To repair the website"], "B", "The interruption is for a security update.", "detail"], ["What will users still be able to do?", ["Renew digital books", "Borrow through the app", "Open downloaded items", "Visit during extended hours"], "C", "Previously downloaded items continue to open.", "detail"]] },
  { lines: [["Speaker", "Today’s leadership seminar has moved from Room 204 to the Lakeview Auditorium. The auditorium is in the building across the courtyard, beside the cafeteria. Registration will remain in this lobby until nine fifteen. Because the auditorium is cooler, participants may wish to bring a jacket. The first session will still start promptly at nine thirty."]], questions: [["What change is announced?", ["A different speaker", "A new starting time", "A different room", "A shorter registration period"], "C", "The seminar has moved to another venue.", "detail"], ["Where should participants register?", ["In the current lobby", "Beside the cafeteria", "In Room 204", "Inside the auditorium"], "A", "Registration remains in the lobby.", "detail"], ["Why might participants bring a jacket?", ["They will cross a courtyard.", "The auditorium is cool.", "Rain is expected.", "The seminar ends late."], "B", "The speaker warns that the auditorium is cooler.", "detail"]] },
];

const conversationUnits = makeListeningGroups(conversationData, "short-conversations", "conversation", "Listen to the conversation. Answer the three questions.");
const talkUnits = makeListeningGroups(talkData, "short-talks", "talk", "Listen to the talk. Answer the three questions.");

const incompleteData: Array<[string, [string, string, string, string], Choice["id"], string, Difficulty, Skill]> = [
  ["The finance team will review the proposal _____ making a final recommendation.", ["before", "among", "during", "unless"], "A", "Before correctly introduces the action that precedes the recommendation.", "easy", "grammar"],
  ["Ms. Alvarez is highly _____ for the regional manager position.", ["qualify", "qualified", "qualification", "qualifyingly"], "B", "The adjective qualified follows the linking verb is.", "easy", "grammar"],
  ["Please submit travel receipts _____ ten days of returning from a business trip.", ["within", "beside", "throughout", "toward"], "A", "Within expresses the permitted time limit.", "medium", "grammar"],
  ["The new packaging is both attractive _____ environmentally friendly.", ["or", "but", "and", "so"], "C", "The correlative structure is both … and.", "easy", "grammar"],
  ["Customers may request a refund if a product arrives _____.", ["damage", "damaged", "damaging", "damages"], "B", "Damaged is the adjective describing the product’s condition.", "easy", "grammar"],
  ["The board postponed its vote because several members were _____.", ["absent", "brief", "equal", "vacant"], "A", "Absent means not present at the meeting.", "easy", "vocabulary"],
  ["By next June, the research department _____ the three-year study.", ["completes", "completed", "will have completed", "has completing"], "C", "The future perfect fits an action completed by a future deadline.", "hard", "grammar"],
  ["The hotel offers complimentary shuttle service for the _____ of its guests.", ["convenient", "conveniently", "convenience", "convene"], "C", "The noun convenience follows for the.", "medium", "grammar"],
  ["Neither the supervisor nor the technicians _____ aware of the revised deadline.", ["was", "were", "be", "has"], "B", "The verb agrees with the nearer plural subject technicians.", "hard", "grammar"],
  ["Our supplier has agreed to _____ the defective components at no cost.", ["replace", "persuade", "attend", "divide"], "A", "Replace means exchange defective items for working ones.", "easy", "vocabulary"],
  ["Applications received after Friday will not be _____.", ["consideration", "considered", "considering", "considerably"], "B", "The passive construction requires the past participle considered.", "easy", "grammar"],
  ["The museum’s latest exhibition has attracted _____ more visitors than expected.", ["significance", "significant", "significantly", "signify"], "C", "The adverb significantly modifies more.", "medium", "grammar"],
  ["We recommend that each participant _____ a laptop to the workshop.", ["brings", "bring", "brought", "bringing"], "B", "Recommend that takes the base-form subjunctive bring.", "hard", "grammar"],
  ["The lease can be renewed, _____ both parties agree to the new terms.", ["provided that", "despite", "in addition", "whereas"], "A", "Provided that introduces a condition.", "medium", "grammar"],
  ["Because demand has increased, the factory is operating at full _____.", ["capacity", "permission", "identity", "accuracy"], "A", "Operating at full capacity means producing as much as possible.", "medium", "vocabulary"],
  ["Mr. Chen asked whether the conference fee _____ accommodation.", ["includes", "including", "to include", "inclusion"], "A", "The clause needs the finite verb includes.", "easy", "grammar"],
  ["The software update will be installed _____ to minimize disruption.", ["overnight", "formerly", "nearly", "rarely"], "A", "Overnight describes when installation will occur.", "easy", "vocabulary"],
  ["All employees are expected to comply _____ the updated safety policy.", ["at", "for", "with", "from"], "C", "The fixed expression is comply with.", "medium", "grammar"],
  ["The consultant’s recommendations were clear, practical, and easy to _____.", ["implement", "implementing", "implementation", "implemented"], "A", "The infinitive phrase requires the base verb implement.", "medium", "grammar"],
  ["A confirmation email will be sent _____ your registration is complete.", ["once", "yet", "while", "than"], "A", "Once means as soon as the registration is complete.", "easy", "grammar"],
  ["The restaurant has earned an excellent _____ for attentive service.", ["reputation", "repetition", "reservation", "requirement"], "A", "Reputation means the general opinion people hold about a business.", "easy", "vocabulary"],
  ["Employees wishing to transfer departments should speak to _____ supervisor first.", ["they", "them", "their", "theirs"], "C", "The possessive adjective their modifies supervisor.", "easy", "grammar"],
  ["The construction project remains on schedule _____ unusually heavy rainfall.", ["because", "despite", "therefore", "except"], "B", "Despite contrasts the progress with the heavy rainfall.", "medium", "grammar"],
  ["A technician will inspect the equipment and determine whether repairs are _____.", ["necessary", "necessarily", "necessity", "necessitate"], "A", "The adjective necessary follows are.", "easy", "grammar"],
  ["We have received fewer complaints since the new process was _____.", ["introduce", "introduced", "introducing", "introduction"], "B", "The passive voice requires introduced.", "easy", "grammar"],
  ["The keynote speaker discussed several issues _____ affect small businesses.", ["who", "whose", "that", "what"], "C", "That introduces a relative clause modifying issues.", "medium", "grammar"],
  ["Parking permits must be displayed _____ on the vehicle’s dashboard.", ["visibility", "visible", "visibly", "vision"], "C", "The adverb visibly modifies displayed.", "medium", "grammar"],
  ["The marketing team is seeking a more _____ way to reach first-time buyers.", ["effect", "effective", "effectively", "effectiveness"], "B", "The adjective effective modifies way.", "easy", "grammar"],
  ["Not until the final inspection _____ the building open to the public.", ["the building will", "will the building", "the building", "does the building"], "B", "Negative fronting requires inversion: will the building.", "hard", "grammar"],
  ["Please keep your receipt, as it is _____ for all exchanges.", ["required", "occupied", "estimated", "attached"], "A", "Required means necessary for an exchange.", "easy", "vocabulary"],
];

const incompleteUnits: QuestionUnit[] = incompleteData.map(([prompt, optionTexts, answer, explanation, difficulty, skill], index) => {
  const id = `sentence-${String(index + 1).padStart(2, "0")}`;
  return { id, section: "reading", part: "incomplete-sentences", instruction: "Choose the word or phrase that best completes the sentence.", stimulus: { kind: "none" }, questions: [makeQuestion(`${id}-q1`, prompt, optionTexts, answer, explanation, difficulty, [skill])] };
});

interface ReadingGroupData {
  title: string;
  body: string;
  sourceLabel?: string;
  questions: Array<[string, [string, string, string, string], Choice["id"], string, Skill]>;
}

const textCompletionData: ReadingGroupData[] = [
  { title: "Staff notice", body: "Beginning Monday, bicycles may no longer be stored beside the west entrance. The space must remain clear for emergency access. Employees who cycle to work should use the new covered racks behind Building C. Access cards will (1) _____ the rear gate between 6:00 A.M. and 10:00 P.M. A repair station with a pump and basic tools has also been (2) _____ nearby. Questions may be directed to Facilities, (3) _____ manages the bicycle program.", questions: [["Choose the best answer for blank (1).", ["open", "opened", "opening", "opens"], "A", "The modal will requires the base verb open.", "grammar"], ["Choose the best answer for blank (2).", ["install", "installed", "installing", "installation"], "B", "Has been installed forms the present perfect passive.", "grammar"], ["Choose the best answer for blank (3).", ["who", "which", "where", "when"], "A", "Who refers to the people in the Facilities department.", "grammar"]] },
  { title: "Order update", body: "Dear Ms. Holloway, Thank you for ordering the Luma desk lamp. The walnut model is temporarily out of stock. We can ship the white model immediately or (1) _____ your order until walnut units arrive next Friday. If you choose to wait, expedited shipping will be provided at no (2) _____ charge. Please reply with your preference by Tuesday; otherwise, we will automatically issue a full (3) _____. Sincerely, Arden Home Office", questions: [["Choose the best answer for blank (1).", ["hold", "held", "holding", "holds"], "A", "Can applies to both ship and hold, so the base form is needed.", "grammar"], ["Choose the best answer for blank (2).", ["additional", "addition", "additionally", "add"], "A", "Additional modifies the noun charge.", "grammar"], ["Choose the best answer for blank (3).", ["refund", "receipt", "shipment", "catalog"], "A", "A refund returns the customer’s payment if the order is not fulfilled.", "vocabulary"]] },
  { title: "Community workshop", body: "The Greenfield Business Association will host a free workshop on reducing office energy use. The session is designed for small-business owners but is open to all local (1) _____. Participants will learn how to measure electricity consumption and compare efficient equipment. Because seating is limited, advance registration is (2) _____. Attendees are also encouraged to bring a recent utility bill so the instructor can provide (3) _____ advice.", questions: [["Choose the best answer for blank (1).", ["residents", "residences", "reside", "residential"], "A", "Residents are people who live locally.", "vocabulary"], ["Choose the best answer for blank (2).", ["require", "required", "requiring", "requirement"], "B", "Is required is the correct passive structure.", "grammar"], ["Choose the best answer for blank (3).", ["personalized", "personalize", "personally", "person"], "A", "Personalized modifies advice.", "grammar"]] },
  { title: "Website migration", body: "On Saturday, our customer portal will move to a new hosting platform. Users may notice brief interruptions between 1:00 and 3:00 A.M. No action is required, and account information will transfer (1) _____. After the migration, bookmarks to individual invoice pages may no longer work. Users should sign in from the main page and create new bookmarks (2) _____. Our support team will be available from 7:00 A.M. to answer questions and resolve any issues that (3) _____.", questions: [["Choose the best answer for blank (1).", ["automatically", "automatic", "automation", "automate"], "A", "The adverb automatically modifies transfer.", "grammar"], ["Choose the best answer for blank (2).", ["instead", "already", "nearly", "ever"], "A", "Instead signals the replacement action.", "vocabulary"], ["Choose the best answer for blank (3).", ["arise", "raise", "rise up them", "arising"], "A", "Issues arise; raise requires an object.", "vocabulary"]] },
  { title: "Volunteer day", body: "Last Friday, more than sixty employees volunteered at Brookside Park. Teams planted trees, repainted benches, and collected litter along the river path. The event was originally planned for April but was (1) _____ because of flooding. Thanks to careful coordination, all scheduled work was completed (2) _____ noon. The organizing committee has already received several suggestions for next year and will review (3) _____ at its October meeting.", questions: [["Choose the best answer for blank (1).", ["postponed", "expanded", "reserved", "delivered"], "A", "Flooding caused the event to be delayed or postponed.", "vocabulary"], ["Choose the best answer for blank (2).", ["by", "since", "among", "through"], "A", "By noon means no later than noon.", "grammar"], ["Choose the best answer for blank (3).", ["them", "their", "they", "themselves"], "A", "The object pronoun them refers to the suggestions.", "grammar"]] },
];

const singlePassageData: ReadingGroupData[] = [
  { title: "Harbor Café receipt survey", sourceLabel: "Email", body: "To: Recent customers\nFrom: Harbor Café\nSubject: Tell us about your visit\n\nThank you for visiting Harbor Café on May 14. We are testing a new lunch menu and would appreciate your feedback. Complete the five-minute survey by May 21 and we will email you a voucher for a complimentary hot drink. The voucher may be used at either Harbor Café location through June 30, but it cannot be combined with another promotion. Your receipt code, HBR-7142, is required to begin the survey.", questions: [["Why was the email sent?", ["To announce a new location", "To request feedback", "To correct a receipt", "To advertise breakfast"], "B", "The café asks the customer to complete a survey about the new lunch menu.", "purpose"], ["What will survey participants receive?", ["A free hot drink voucher", "A full meal", "A refund", "A membership card"], "A", "Participants are promised a voucher for a complimentary hot drink.", "detail"], ["What is needed to start the survey?", ["A membership number", "A location name", "A receipt code", "A menu selection"], "C", "The receipt code is explicitly required.", "detail"]] },
  { title: "Ridgeway Trail closure", sourceLabel: "Public notice", body: "The north section of Ridgeway Trail will be closed from September 3 through September 12 while crews replace two wooden footbridges. Hikers may still access Lake Point from the southern entrance, but the route will be approximately three kilometers longer. Parking at the northern entrance will also be unavailable. Updated maps are posted at visitor centers and at ridgewayparks.example. Work may be extended if weather conditions are unsafe.", questions: [["Why will part of the trail close?", ["To build a visitor center", "To replace footbridges", "To expand parking", "To update signs"], "B", "Crews will replace two wooden footbridges.", "detail"], ["What is indicated about the alternative route?", ["It begins at Lake Point.", "It requires a guide.", "It is longer.", "It is closed in bad weather."], "C", "The southern route is about three kilometers longer.", "detail"], ["What could cause the work period to change?", ["Visitor demand", "Weather conditions", "Map availability", "Parking fees"], "B", "Unsafe weather may extend the work.", "inference"]] },
  { title: "Mentor program", sourceLabel: "Internal announcement", body: "Applications are now open for the company’s six-month mentoring program. Employees with at least one year of service may apply as mentees. Mentors must have three years of service and approval from their department manager. Participants meet for one hour each month and attend two skills workshops. Applications submitted by August 8 will receive placement decisions by August 22. Because matches depend on professional goals, not every applicant can be placed this cycle.", questions: [["Who may apply as a mentee?", ["Any new employee", "Employees with one year of service", "Only department managers", "Workshop instructors"], "B", "Mentees need at least one year at the company.", "detail"], ["What must mentors obtain?", ["Manager approval", "A training certificate", "A mentee recommendation", "Travel funding"], "A", "Mentors require approval from their department manager.", "detail"], ["Why might an applicant not receive a placement?", ["The workshops are full.", "Meetings are too frequent.", "A suitable goal-based match may be unavailable.", "Applications close early."], "C", "The notice says matches depend on professional goals and cannot be guaranteed.", "inference"]] },
  { title: "Product listing: FoldGo stand", sourceLabel: "Online catalog", body: "FoldGo Laptop Stand — $48\nMade from recycled aluminum, the FoldGo raises laptops to three adjustable heights and folds flat for travel. The stand supports devices up to 17 inches and includes a cotton storage sleeve. Orders placed before 2:00 P.M. ship the same business day. Returns are accepted within 30 days if the stand is unused and the original packaging is included. Laptops and keyboards shown in photographs are not included.", questions: [["What feature makes the stand convenient for travel?", ["It includes a keyboard.", "It folds flat.", "It weighs 17 pounds.", "It has wheels."], "B", "The stand folds flat and includes a sleeve.", "detail"], ["When will an order placed at 1:30 P.M. ship?", ["The same business day", "Within 17 days", "After 2:00 P.M. tomorrow", "When packaging is returned"], "A", "Orders before 2:00 P.M. ship that business day.", "inference"], ["What is required for a return?", ["A product photograph", "A return fee", "Original packaging", "A cotton sleeve only"], "C", "Unused items must include the original packaging.", "detail"]] },
  { title: "Conference room reservation", sourceLabel: "Memo", body: "Starting October 1, meeting rooms must be reserved through the Atlas calendar rather than by contacting reception. Reservations may be made up to 60 days in advance. Rooms not occupied within 15 minutes of the reservation time will become available to others. For meetings with external guests, organizers should select the “Visitor Access” option so reception receives an attendee list. Training on the Atlas calendar will be offered September 24 and 26 at 2:00 P.M.", questions: [["What changes on October 1?", ["Reception closes earlier.", "A new room-booking method begins.", "Meeting rooms move.", "Visitor lists are eliminated."], "B", "Employees must begin using the Atlas calendar for reservations.", "detail"], ["When may an unused reserved room be released?", ["After 15 minutes", "After 60 days", "At 2:00 P.M.", "On September 26"], "A", "A room becomes available if unoccupied after 15 minutes.", "detail"], ["Why should an organizer select Visitor Access?", ["To extend a reservation", "To receive training", "To notify reception about guests", "To reserve 60 days ahead"], "C", "The option sends reception the external attendee list.", "purpose"]] },
];

interface DocumentGroupData {
  documents: Array<{ label: string; title: string; body: string }>;
  questions: ReadingGroupData["questions"];
}

const multiplePassageData: DocumentGroupData[] = [
  { documents: [{ label: "Email", title: "From: Mina Cho — Delivery question", body: "Hello, I ordered six folding display panels for our trade show. The tracking page says they will arrive Thursday, but our team leaves Wednesday evening. Can the panels be held at your downtown depot for pickup? Order PX-4481." }, { label: "Reply", title: "From: CityShip Support", body: "Hello Ms. Cho, We redirected order PX-4481 to our downtown depot at 18 King Street. It will be ready after 3:00 P.M. Tuesday. Bring photo identification and this message. The depot closes at 7:00 P.M. on weekdays. Packages not collected within five business days return to the sender." }], questions: [["Why did Ms. Cho contact CityShip?", ["To cancel a trade show", "To change how an order is received", "To purchase more panels", "To report damaged goods"], "B", "She asks to collect the order at a depot instead of waiting for delivery.", "purpose"], ["When can the order first be collected?", ["Tuesday after 3:00 P.M.", "Wednesday evening", "Thursday morning", "Five days later"], "A", "The reply says it will be ready after 3:00 Tuesday.", "detail"], ["What must Ms. Cho bring?", ["A trade-show ticket", "The original panels", "Photo identification and the message", "A sender’s address"], "C", "The depot requires photo ID and the reply message.", "detail"]] },
  { documents: [{ label: "Event listing", title: "Downtown Design Walk — Saturday, June 8", body: "Ten studios will open from 10:00 A.M. to 4:00 P.M. Free maps are available at the Central Arts Hub. At 11:30, architect Elena Ruiz will lead a 45-minute walking tour. Space is limited to 20 participants; reserve online. The closing reception at Studio Ten begins at 4:30." }, { label: "Message", title: "To: Design team", body: "I reserved four places on Elena Ruiz’s tour. Let’s meet at the Central Arts Hub at 10:45 so we have time to collect maps. Priya will join us for the studios but has a client call at noon, so she cannot take the full tour. —Jon" }], questions: [["What requires advance registration?", ["Collecting a map", "The walking tour", "Entering the studios", "The reception"], "B", "The tour has limited space and must be reserved online.", "detail"], ["Why does Jon suggest meeting at 10:45?", ["To attend the reception", "To speak with a client", "To collect maps before the tour", "To visit Studio Ten first"], "C", "They want maps before the 11:30 tour.", "inference"], ["What is indicated about Priya?", ["She designed the map.", "She will leave the tour early or skip it.", "She reserved the places.", "She hosts the reception."], "B", "Her noon call prevents her from completing the 11:30 forty-five-minute tour.", "inference"]] },
  { documents: [{ label: "Invoice", title: "Oak & Reed Office Supply", body: "Invoice 78103\n12 ergonomic chairs — $2,160\n2 standing desks — $980\nDelivery — $85\nTotal — $3,225\nDelivery date: November 6\nPayment due: November 20" }, { label: "Email", title: "From: Joel Anders — Invoice 78103", body: "The chairs arrived this morning and are in excellent condition. Only one standing desk was delivered, although the invoice lists two. Please send the missing desk before our new employee starts on November 13. Let me know whether the invoice will be revised or if payment should wait until the order is complete." }], questions: [["What item is missing?", ["A chair", "A standing desk", "An invoice", "A delivery label"], "B", "Joel states that only one of two standing desks arrived.", "detail"], ["Why does Joel mention November 13?", ["Payment is due then.", "A new employee begins then.", "The chairs will be returned then.", "The invoice was issued then."], "B", "He needs the desk before a new employee starts.", "purpose"], ["What does Joel ask the supplier to clarify?", ["Whether the chairs are ergonomic", "Where the order was delivered", "How to handle the invoice and payment", "How much delivery costs"], "C", "He asks whether the invoice changes or payment should wait.", "detail"]] },
  { documents: [{ label: "Workshop schedule", title: "Clear Communication Workshop", body: "9:00 — Writing concise email subjects\n10:15 — Break\n10:30 — Delivering project updates\n12:00 — Lunch\n1:00 — Handling difficult questions\n2:30 — Practice presentations\n4:00 — Closing comments" }, { label: "Note", title: "To: Workshop participants", body: "Tomorrow’s workshop will start as scheduled in Room 5B. The cafeteria is closed, so lunch boxes will be provided in the lobby at noon. Please email dietary requests by 3:00 P.M. today. Bring the two-minute project update you prepared; you will use it during the afternoon practice." }], questions: [["What happens immediately before lunch?", ["A break", "Project updates", "Difficult questions", "Practice presentations"], "B", "The 10:30 project-updates session precedes the noon lunch.", "detail"], ["Why should participants email before 3:00 P.M.?", ["To change rooms", "To submit a project", "To request a special lunch", "To cancel a presentation"], "C", "Dietary requests affect the provided lunch boxes.", "purpose"], ["What should participants bring?", ["A cafeteria pass", "A two-minute update", "Closing comments", "A lunch box"], "B", "The note explicitly asks them to bring a prepared update.", "detail"]] },
  { documents: [{ label: "Rental listing", title: "Market Street Studio", body: "Bright furnished studio, five-minute walk from East Station. Monthly rent includes water and Internet. Electricity is billed separately. Minimum six-month lease. No parking space, but secure indoor bicycle storage is available. Viewings Tuesday and Thursday evenings by appointment." }, { label: "Message", title: "From: Leon Park", body: "Hello, I’m interested in the Market Street studio. I will be in town this Thursday and could visit after 6:00 P.M. I do not own a car, so the lack of parking is fine. Could you confirm whether the desk shown in the photograph is included with the other furniture? I hope to move in for an eight-month internship beginning July 1." }], questions: [["Which cost is not included in the rent?", ["Water", "Internet", "Electricity", "Bicycle storage"], "C", "Electricity is billed separately.", "detail"], ["Why is the studio’s parking policy acceptable to Leon?", ["He has a bicycle.", "He does not own a car.", "He works at East Station.", "He will rent for eight months."], "B", "Leon explicitly says he does not own a car.", "detail"], ["What does Leon want to confirm?", ["Whether a desk is included", "Whether Thursday viewing is free", "Whether the lease can start earlier", "Whether Internet is secure"], "A", "He asks whether the photographed desk is part of the furnishings.", "detail"]] },
];

function makeReadingGroups(data: ReadingGroupData[], part: "text-completion" | "single-passage", prefix: string, instruction: string): QuestionUnit[] {
  return data.map((group, index) => {
    const id = `${prefix}-${String(index + 1).padStart(2, "0")}`;
    return { id, section: "reading", part, instruction, stimulus: { kind: "passage", title: group.title, body: group.body, sourceLabel: group.sourceLabel }, questions: group.questions.map(([prompt, optionTexts, answer, explanation, skill], questionIndex) => makeQuestion(`${id}-q${questionIndex + 1}`, prompt, optionTexts, answer, explanation, questionIndex === 2 ? "hard" : "medium", [skill, part === "text-completion" ? "grammar" : "reading-comprehension"])) };
  });
}

const textCompletionUnits = makeReadingGroups(textCompletionData, "text-completion", "completion", "Read the text and choose the best answer for each blank.");
const singlePassageUnits = makeReadingGroups(singlePassageData, "single-passage", "single", "Read the passage and answer the three questions.");

const multiplePassageUnits: QuestionUnit[] = multiplePassageData.map((group, index) => {
  const id = `multiple-${String(index + 1).padStart(2, "0")}`;
  return { id, section: "reading", part: "multiple-passage", instruction: "Refer to the documents and answer the three questions.", stimulus: { kind: "documents", documents: group.documents }, questions: group.questions.map(([prompt, optionTexts, answer, explanation, skill], questionIndex) => makeQuestion(`${id}-q${questionIndex + 1}`, prompt, optionTexts, answer, explanation, questionIndex === 2 ? "hard" : "medium", [skill, "reading-comprehension"])) };
});

export const QUESTION_BANK: QuestionUnit[] = [
  ...photographUnits,
  ...responseUnits,
  ...conversationUnits,
  ...talkUnits,
  ...incompleteUnits,
  ...textCompletionUnits,
  ...singlePassageUnits,
  ...multiplePassageUnits,
];

export function getBankSummary(bank: readonly QuestionUnit[] = QUESTION_BANK): Record<QuestionPart, number> {
  return bank.reduce((summary, unit) => {
    summary[unit.part] += unit.questions.length;
    return summary;
  }, {
    photographs: 0,
    "question-response": 0,
    "short-conversations": 0,
    "short-talks": 0,
    "incomplete-sentences": 0,
    "text-completion": 0,
    "single-passage": 0,
    "multiple-passage": 0,
  } satisfies Record<QuestionPart, number>);
}

export function getTotalQuestionCount(bank: readonly QuestionUnit[] = QUESTION_BANK): number {
  return bank.reduce((total, unit) => total + unit.questions.length, 0);
}
