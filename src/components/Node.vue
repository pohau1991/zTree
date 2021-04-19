<template>
  <div class="pane">
    <h3 class="nodeTitle">{{ processContent(this.computedNode.page_title) }}</h3>
    <div class="nodeContent" v-html="processContent(this.computedNode.content)"></div>
    <div class="question-panel">
      <div v-if="buttons.length" class="content-answer">
        <ul class="answers">
          <li v-for="b in buttons" :key="b.id">
            <form @submit.prevent="progressForm($event, b)"> 
              <div v-if="formFields" class="formFieldContainer">
                <template v-for="(ff,ffIndex) in formFields">
                  <select v-if="ff.type == 'select'" :key="ffIndex" class="formFieldAnswer">
                    <option v-for="ffd in formFieldSelectOptionConverter(ff.options)" :key="ffd">{{ffd}}</option>
                  </select>
                  <div v-else-if="ff.type== 'checkbox'" class ="checkboxContainer" :key="ffIndex">
                      <span><input class="formFieldAnswer" type="checkbox" :name="ff.name"></span>
                      <label>{{ff.label}}</label>
                  </div>
                </template>
              </div>
              <button type="" @click="changeIndex(b.target_node_id)" class="btn btn-zingtree col-2">{{ b.button_text }}</button>
            </form>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import store from '../store';
import axios from 'axios';

export default {
  name: "Node",
  props: ['findex'],
  data() {
    return {
      store: store,
      sharedState: store.state,
      thing: '',
      progression: [],
      logicArray: [],
      formIndex: 1,
    }
  },
  computed: {
    buttons() {
      return this.computedNode.buttons || []
    },
    computedNode() {
      return this.sharedState.survey.nodes[this.sharedState.activeNodeId] || {}
    },
    formFields(){
      return this.computedNode.formfields;
    },
  },
  mounted(){
    this.sharedState.activeNodeId = this.$route.params.findex ? parseInt(this.$route.params.findex) : this.sharedState.activeNodeId;
  },
  watch:{
    '$route.params.findex':{
      handler:function(findex)
      {
        this.sharedState.activeNodeId = findex;
        console.log(this.sharedState.activeNodeId);
      }
    }
    //Should use Mutations to commit this in a shared
    
  },
  created(){
    this.progression = localStorage.getItem('progress') ? JSON.parse(localStorage.getItem('progress')) : [];
    this.getSurveyInfo();
  },
  methods: {
    async getSurveyInfo(){
      await axios.get('https://zt-eng.s3.us-east-1.amazonaws.com/fe-challenge/survey.json')
                    .then(response => {
                      this.sharedState.survey = response.data;
                    })
                    .catch(error => {
                      console.log(error);
                    });
    },
    progressForm($event=null, ele=null){
      let tempNode = this.computedNode;      
      this.progression[tempNode.project_node_id] = { "project_node_id" : tempNode.project_node_id,
        "type": tempNode.type,
        "variable":tempNode.variable,
        "answer": ele,  
        "options": {},
        "conditions": tempNode.conditions,
        "formfields" : []
      };
      if($event != null){
        let ffAnswers = $event.target.getElementsByClassName("formFieldAnswer");
        //Matching the formfields of the current Node to the ffAnswers If there're any
        for(let i = 0; i < this.computedNode.formfields.length; i++){
          let tempFF = this.computedNode.formfields[i];
          if(tempFF.type == 'select'){
            //Store Answer of the formfields in the hidden_value attribute
            tempFF.hidden_value = ffAnswers[i].options[ffAnswers[i].options.selectedIndex].value;
            this.progression[tempNode.project_node_id].formfields.push(tempFF);
          }
          else if(tempFF.type == 'checkbox'){
            tempFF.hidden_value = ffAnswers[i].checked;
            this.progression[tempNode.project_node_id].formfields.push(tempFF);
          }
        }
      }
      
      this.moveForward();
      localStorage.setItem('progress', JSON.stringify(this.progression));
    },
    changeIndex(tempIndex){
      this.formIndex = tempIndex;
    },
    moveForward(){
      this.sharedState.activeNodeId = this.formIndex;
      
      this.$router.push({ path: '/'+this.sharedState.activeNodeId })
      if(!this.computedNode.display)
      {
        if(this.computedNode.type.toLowerCase() == 'logic'){
          this.logicArray[this.sharedState.activeNodeId] = this.computedNode.conditions;
        }
        console.log(this.logicArray);
        this.progressForm();
      }
    },
    fulfillLogic(){
      
    },
    processContent(content){
      let temp = content.split(/(?=[#])|(?<=[#])/g);
      
      //Find all replaceable variables
      if(temp.length > 1){
        let variableArray = [];
        let counter = 0;
        //Populate a condensed version of the array that contains all the variables that needs to be replaced
        temp.forEach(function(value, key) {
          if(value == '#'){
            counter++;
            if(counter == 2){
              variableArray.push({'index': key-1, 'string_replace': temp[key-1]})
              counter = 0;
            }
          }
        });

        if(variableArray.length > 0){
          for(let i = 0; i < this.progression.length; i++){
          //Tranversing the progression object with the variable array and to find a match
            for(let j = variableArray.length; j > 0; j--){
              //Replace from the top down, so we don't have to worry about the index being shifted when looping
              if(this.progression[i] && this.progression[i].variable == variableArray[j-1].string_replace){
                temp[variableArray[j-1].index] = this.progression[i].answer.value

                variableArray.splice(j-1, 1);
              }  
            }
            //Return when variable Array is empty
            if(variableArray.length == 0){
              return temp.join("").replaceAll('#', '');
            }
            
          }  
        }
        
      }
      //Return original content if there're no replaceable value
      return content;
    },
    formFieldsInput(ff){

    },
    formFieldSelectOptionConverter(temp){
      return temp.split("\r\n");
    }
  }
}
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}

ul.answers {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

ul.answers li {
  padding: 0;
  margin: 10px 0;
}

button.btn {
  display: flex;
  padding: 10px 7px;
  background: #0e5a38;
  border-radius: 5px;
  color: #fff;
  text-decoration: none;
  justify-content: center;
}

button.btn .col-2 {
  width: 50%;
}

.nodeContent {
  text-align: justify;
}

.nodeQuestion {
    background: azure;
    font-weight: bold;
    font-style: italic;
    padding: 10px;
    margin-top: 20px;
}
</style>
