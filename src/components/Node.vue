<template>
  <div class="pane">
    <h3 class="nodeTitle">{{ processContent(this.node.page_title) }}</h3>
    <div class="nodeContent" v-html="this.node.content"></div>
    <div class="question-panel">
      <div v-if="buttons.length" class="content-answer">
        <ul class="answers">
          <li v-for="b in buttons" :key="b.id">
            <form @submit.prevent="progressForm($event, b)">
              <button type="" class="btn btn-zingtree col-2">{{ b.button_text }}</button>
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
  data() {
    return {
      store: store,
      sharedState: store.state,
      thing: '',
      progression: [],
    }
  },
  computed: {
    buttons() {
      return this.node.buttons || []
    },
    node() {
      return this.sharedState.survey.nodes[this.sharedState.activeNodeId] || {}
    }
  },
  created(){
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
    progressForm($event, ele=null){
      let tempNode = this.node;      
      this.progression[tempNode.project_node_id] = { "project_node_id" : tempNode.project_node_id,
        "type": tempNode.type,
        "variable":tempNode.variable,
        "answer": ele,
        "options": {}
      };
      console.log(this.progression);
      this.moveForward();
    },
    moveForward(){
      this.sharedState.activeNodeId++;
      if(!this.node.display)
      {
        this.moveForward();
      }
    },
    processContent(content){
      let temp = content.split("#");
      if(temp.length > 1){
        for(let i = 0; i < this.progression.length; i++){
          if(this.progression[i] && this.progression[i].variable == temp[1]){
            temp[1] = this.progression[i].answer.value;
            return temp.join("");
          }
        }  
      }
      return content;
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
