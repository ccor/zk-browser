
$(document).ready(async function(){

  async function loadjs(src) {
    if(src instanceof Array){
      return Promise.all(src.map(i => loadjs(i)))
    }
    let script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.src = src;
    document.getElementsByTagName('body')[0].appendChild(script)
    return new Promise(resolve => {
        script.onload = () => {
            return resolve('ok')
        }
    })
  }

  await loadjs([
    'js/vue_zk.js'
  ])
  
  var router = new VueRouter({
    routes:[
      {path: '/', component: Vue.component('zk')}
    ]
  })
  
  window.app = new Vue({
      router,
      el: '#app',
      data: {
          
      },
      mounted: function(){

      },
      methods: {
          toast: function(msg){
            this.$refs.toast.show(msg);
          }
      }
  });

});




