import Vue from 'vue'
import VueRouter from 'vue-router'
import Node from './components/Node.vue'

Vue.use(VueRouter);

const routes = [
  { path: '/:findex', component: Node, props:true},
]

const router = new VueRouter({ mode: 'history', routes })

export { router, routes }