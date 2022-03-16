<?php
declare (strict_types = 1);
// +----------------------------------------------------------------------
// | swiftAdmin 极速开发框架 [基于ThinkPHP6开发]
// +----------------------------------------------------------------------
// | Copyright (c) 2020-2030 http://www.swiftadmin.net
// +----------------------------------------------------------------------
// | swiftAdmin.net High Speed Development Framework
// +----------------------------------------------------------------------
// | Author: 权栈 <coolsec@foxmail.com> Apache 2.0 License Code
// +----------------------------------------------------------------------
namespace app\admin\controller\system;

use app\AdminController;
use think\facade\Db;
use app\common\model\system\Content;
use app\common\model\system\Channel;

class Recyclebin extends AdminController
{

    public function initialize() 
    {
		parent::initialize();
        $this->model = new Content();
    }

    /**
     * 查看回收站
     */
    public function index() {

        if (request()->isAjax()) {

            // 生成查询条件
            $post = input();
            $where = array();
            if (!empty($post['title'])) {
                $where[] = ['title','like','%'.$post['title'].'%'];
            }

            // 生成查询数据
            $list = $this->model->onlyTrashed()->with([
                'channel','category'
            ])->where($where)->order("id asc")->select()->toArray();
            return $this->success('查询成功', NULL, $list, count($list));
        }
        
        return view();
    }
    
    /**
     * 恢复数据
     * @access public
     * @param  null
     * @return string
     */	
	public function restore()
	{
        if (request()->isAjax()) {
            
			Db::startTrans();
			try {
                $list = $this->model->onlyTrashed()->where(
                    $this->buildBeforeWhere()
                    )->select();
                foreach ($list as $key => $item) {
                    $this->status += $item->restore();
                }
                Db::commit();
            } catch (\PDOException $e) {
                Db::rollback();
                return $this->error($e->getMessage());
            } catch (\Throwable $th) {
                Db::rollback();
                return $this->error($th->getMessage());
            }
            
            $this->status && $this->success();
        }

        return $this->error();
	}

    /**
     * 删除资源/清空回收站
     * @access protected
     * @param  null      		
     * @return string		
     */	
	public function destroy() 
	{

        if (request()->isAjax()) {
            Db::startTrans();
			try {

                $list = $this->model->onlyTrashed()->where(
                    $this->buildBeforeWhere()
                    )->select();
                foreach ($list as $key => $item) {
                    $item['delete_force'] = time();
                    $table = Channel::getChannelList($item['cid'])['table'];
                    Db::name('content_'.$table)->where('aid',$item->id)->delete();
                    $this->status += $item->force()->delete();
                }
    
                Db::commit();
            } catch (\PDOException $e) {
                Db::rollback();
                return $this->error($e->getMessage());
            } catch (\Throwable $th) {
                Db::rollback();
                return $this->error($th->getMessage());
            }
            
            $this->status && $this->success();
        }

        return $this->error();
	}

    /**
     * 重载添加
     */
    public function add() {
        return $this->error('invalid');
    }
    
    /**
     * 重载编辑
     */
    public function edit() {
        return $this->error('invalid');
    }

    /**
     * 重载删除
     */
    public function del() {
        return $this->error('invalid');
    }
}
