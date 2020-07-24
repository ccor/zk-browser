Vue.component('tree', {
  template: `
    <ul v-show="show">
      <li v-for="node in nodes">
        <span :class="[node.leaf ? 'leaf' : (node.show ? 'down-arrow' : 'right-arrow'), 'hand']" @click="loadAndToggleExpand(node)"></span>
        <a href="javascript:;" @click="nodeClick($event, node)">{{node.text}}</a>
        <tree :nodes="node.children" :show="node.show" @nodeClick="childNodeClick" @load="childNodeLoad">
      </li>
    </ul>
  `,
  props: ['nodes', 'show'],
  data(){
    return {}
  },
  methods:{
    loadAndToggleExpand(node){
      if(node.show === null){
        this.$emit('load', node)
      }else{
        node.show = !node.show
      }
    },
    nodeClick(e, node){
      this.$emit('nodeClick', node)
    },
    childNodeClick(node){
      this.$emit('nodeClick', node)
    },
    childNodeLoad(node){
      this.$emit('load', node)
    }
  }
  
});

Vue.component('zk', {
    template:`
    <div>
        <div class="sidebar mlist nano">
          <div class="nano-content" id="nav">
          <div class="form-group form-inline">
          
            <input type="text" class="form-control form-control-sm mr-sm-1" v-model="conn.address">
            <button type="button" class="btn btn-sm btn-primary mr-sm-1" @click="connect">连接</button>

          </div>
            <tree :nodes="tree" show="true" @nodeClick="nodeClick" @load="load" />
          </div>
        </div>
        <div class="split-bar" @mousedown="spMouseDown"></div>
        <div id="main" class="content">
          <div class="container-fluid">
            <div class="form-group form-inline" v-if="nodeData.stat">
              <button type="button" class="btn btn-sm btn-primary mr-sm-1" @click="showForm('addChildForm')">增加子节点</button>
              <button type="button" class="btn btn-sm btn-warning mr-sm-1" @click="showForm('editNodeDataForm')">修改数据</button>
              <button type="button" class="btn btn-sm btn-danger mr-sm-1" @click="deleteNode">删除节点</button>
            </div>
            <div class="form-group form-inline" v-show="addChildForm">
              <input type="text" class="form-control form-control-sm mr-sm-1" v-model="form.child">
              <button type="button" class="btn btn-sm btn-primary mr-sm-1" @click="addChild">保存</button>
              <button type="button" class="btn btn-sm btn-secondary mr-sm-1" @click="addChildForm=false">取消</button>
            </div>
            <div class="form-group" v-show="editNodeDataForm">
              <textarea class="form-control mb-3" style="height: 100px" v-model="form.data"></textarea>
              <button type="button" class="btn btn-sm btn-primary mr-sm-1" @click="editNodeData">保存</button>
              <button type="button" class="btn btn-sm btn-secondary mr-sm-1" @click="editNodeDataForm=false">取消</button>
            </div>
            <div class="results">
              <pre v-if="nodeData.data">{{nodeData.data}}</pre>
              <pre v-if="nodeData.stat"><template v-for="(val, name) in nodeData.stat">{{name}} : {{val}}
</template></pre>
            </div>
          </div>
        </div>
    </div>
    `,
    data (){
        return {
          conn: {address: '127.0.0.1:2181', state: 0},
          tree: [],
          data: '',
          nodeData: {data: '', stat: null},
          addChildForm: false,
          editNodeDataForm: false,
          form: {child: '', data: ''},
          currNode: null
        }
    },
    computed: {
      
    },
    filters: {

    },
    mounted () {

    },
    methods: {
      showForm(form){
        this.addChildForm = ('addChildForm' === form)
        this.editNodeDataForm = ('editNodeDataForm' === form)
      },
      async addChild(){
        let child = this.form.child
        if(child === ''){
          return
        }
        let path = this.getPath(this.currNode) + '/' + child
        let res = await this.zk({
          act: 'addNode',
          path
        })
        console.log(res)
        if(res.data === 'success'){
          this.currNode.children.push({text: child, children: [],parent: this.currNode, show: null, leaf: true})
          this.currNode.children.sort((a, b) => {
            var textA = a.text;
            var textB = b.text;
            if (textA < textB) {
              return -1;
            }
            if (textA > textB) {
              return 1;
            }
            return 0;
          })
          this.addChildForm = false
        }
        
      },
      async editNodeData(){
        let data = this.form.data
        let path = this.getPath(this.currNode)
        let res = await this.zk({
          act: 'setData',
          path,
          data
        })
        if(res.data === 'success'){
          this.nodeClick(this.currNode)
          this.editNodeDataForm = false
        }
      },
      async deleteNode(){
        let ret = confirm('确定删除吗?')
        let path = this.getPath(this.currNode)
        console.log(path)
        if(ret){
          let res = await this.zk({
            act: 'removeNode',
            path
          })
          console.log(res)
          let children = this.currNode.parent.children
          children.splice(children.findIndex(i => i === this.currNode), 1)
          this.nodeData = {data: '', stat: null}
          this.currNode = null
          this.showForm('')
        }
      },
      spMouseDown(e){
        let el = e.target
        let oldLeft = el.offsetLeft
        let x = e.pageX
        function move(e) {
          let left = e.pageX - x + oldLeft
          el.style.left = left + 'px'
          document.querySelector('.sidebar').style.width = left + 'px'
          document.querySelector('.content').style.left = (left + 5) + 'px'
        }
        function clear() {
          document.removeEventListener('mousemove', move)
          document.removeEventListener('mouseup', clear)
        }
        document.addEventListener('mousemove', move)
        document.addEventListener('mouseup', clear)
      },
      async zk(cmd){
        if(!cmd.address){
          cmd.address = this.conn.address
        }
        return await axios.post('/api/zk', cmd)
      },
      async connect(){
        let res = await axios.post('/api/zk', {
          act: 'connect',
          address: this.conn.address
        })
        
        let nodes = []
        res.data.sort()
        for(var i in res.data){
          let dir = res.data[i]
          nodes.push({text: dir, children: [], show: null})
        }
        this.tree = nodes
        this.$nextTick(()=>{
          $(".nano").nanoScroller();
        })
      },
      async load(node){
        let path = this.getPath(node)
        let res = await axios.post('/api/zk', {
          act: 'list',
          address: this.conn.address,
          path: path
        })
        res.data.sort()
        for(var i in res.data){
          let dir = res.data[i]
          node.children.push({text: dir, children:[], parent: node, show: null})
        }
        if(node.children.length == 0){
          this.$set(node, 'leaf', true)
        }else{
          node.show = true
        }
      },
      async nodeClick(node){
        let res = await axios.post('/api/zk', {
          act: 'getData',
          address: this.conn.address,
          path: this.getPath(node)
        })
        this.nodeData = res.data
        if(res.data.stat.numChildren === 0){
          this.$set(node, 'leaf', true)
        }
        this.form.data = res.data.data
        this.currNode = node
      },
      getPath(node){
        return (node.parent ? this.getPath(node.parent) + '/' : '/') + node.text
      }
  }
});