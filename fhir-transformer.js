import uniqid from "uniqid";
import dayjs from "dayjs";
import Utils from "../utilities/index.js";

export default class FHIRTrasformer {
  SYSTEM = "identifier=https://github.com/GATEKEEPER-OU/coolsim/";

  constructor(date = null) {
    // @todo dates
    this._startDate = dayjs(date);
  }

  convert(doc) {
    if (!doc) {
      throw new Error(`Error: nothing to convert`);
    }
    // build fhir
    if (Array.isArray(doc)) { return this._convertBulk(doc) }
    return this._convert(doc);
  }

  _getCurrentDay(day = 0) {
    return this._startDate.add(day, 'day').format();
  }

  _convertBulk(docs) {
    // cycle docs and covert
    return docs.map(d => this._convert(d));
  }

  _convert(doc) {
    let id = doc.simulation.concat("-", uniqid());
    let date = this._getCurrentDay(doc.day);
    let entry = [];
    let person = this._person(id, doc);
    // generate array of activities
    let activities = this._actions(id, date, doc.agent, doc.activities.activities);
    // generate array of conditions
    let conditions = this._conditions(id, date, doc.agent, doc.conditions);
    // generate array of questionnaire answers
    let questionnaires = this._questionnaires(id, date, doc.agent, doc.stats);
    entry = entry.concat(person, ...activities, ...conditions, ...questionnaires);
    return entry;
  }

  _person(id, doc) {
    let coding = this._getCode(doc.agent,"patient")
    // return person entry
    return {
      "fullUrl": id,
      "resourceType": "Patient",
      "identifier": [ coding ],
      "active": true,
      "gender": doc.gender,
      "age": doc.age
    };
  }

  _actions(id, date, agent, actions) {
    if(!actions || !Object.keys(actions)){
      console.log(actions);
      throw `actions is mandatory and must be an object`
    }

    // if not defined, return an array of observations for each activity of daily living
    return Object.keys(actions).map(actionName => {
      const duration = actions[actionName];
      const codingActivity = this._getCode(actionName, "activity");
      const codingUnit = this._getCode(duration, "unit/h");
      return {
        "resourceType": "Observation",
        "id":id,
        "effectiveDateTime": date,
        "code": [codingActivity],
        "component": [
          {
            "code": [codingActivity],
            "valueQuantity": codingUnit
          }
        ],
        "status": "preliminary",
        "subject": {
          "display": agent,
          "reference": id
        }
      }
    });
  }


  _conditions(id, date, agent, conditions) {
    if(!conditions || !Object.keys(conditions)){
      console.log(conditions);
      throw `conditions is mandatory and must be an object`
    }
    // if not defined, return an array of observations for each activity of daily living
    return Object.keys(conditions).map(conditionName => {
      const condition = conditions[conditionName];
      // console.log("codingCondition",conditionName);
      const codingCondition = this._getCode(conditionName,"condition");
      // console.log("codingStage",condition.status);
      const codingStage = this._getCode(condition.status, "condition_stage");

      return {
        "resourceType": "Condition",
        "recordedDate": date,
        "severity": condition.severity,
        "code": codingCondition,
        "stage": codingStage,
        "subject": {
          "display": agent,
          "reference": id
        }
      }
    });
  }


  _questionnaires(id, date, agent, stats) {
    if(!stats || !Object.keys(stats)){
      console.log(stats);
      throw `stats is mandatory and must be an object`
    }
    // if not defined, return an array of observations for each activity of daily living
    return Object.keys(stats).map(statName => {
      const stat = stats[statName];
      const codingSurvey = this._getCode(statName, "questionnaire");
      const severityLevel = Utils.rate.rateToSeverity(stat.severity)
      let codingAnswer = this._getCode(severityLevel, statName+"_state/severity_level");
      return {
        "resourceType": "QuestionnaireResponse",
        "id": id,
        "text": `What is your ${statName} in float between 0 and 1 with 0 beung horrible and 1 being top?`,
        "recordedDate": date,
        "status":"completed",
        "identifier":[
          codingSurvey
        ],
        "contained": [
          {
            "resourceType": "Patient",
            "id": id,
            "identifier": [
              {
                "display": agent,
                "reference": id
              }
            ]
          }
        ],
        "item":[
          {
            "linkId": "1",
            "answer": [
              {
                "valueCoding": codingAnswer
              }
            ]
          }
        ]
      }
    });
  }

  // retrieves or generates a coding system in FHIR format
  _getCode(term,type = "element") {
    // @todo if coding is defined return

    // if coding is not defined, generates a coding
    if(!term || !(typeof term === "string" || typeof term === "number") ){
      console.log(`_getCode, typeof term = ${typeof term}, got ${term}`)
      throw `term is mandatory and must be a string, got ${term} of type ${typeof term}`;
    }
    // console.log("term",term);
    return {
      "code": term.toString().trim().toLowerCase().replaceAll(" ", "-"),
      "display": term,
      "system": this.SYSTEM+type
    }
  }
}