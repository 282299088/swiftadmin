<?php
declare (strict_types = 1);

namespace app\common\validate\system;

use think\Validate;
use app\common\model\system\AdminGroup as AdminGroupModel;

class AdminGroup extends Validate
{
    /**
     * 定义验证规则
     * 格式：'字段名'	=>	['规则1','规则2'...]
     *
     * @var array
     */	
    protected $rule =   [
        'pid'    => 'notEqId',
    ];
	
    
    /**
     * 定义错误信息
     * 格式：'字段名.规则名'	=>	'错误信息'
     *
     * @var array
     */	
    protected $message  =   [
        'pid.notEqId'        => '选择上级分类错误！',
    ];
	
	// 自定义验证规则
    protected function notEqId($value, $rules ,$data)
    {
        if ($value == $data['id']) {
            return false;
        }

        if (!empty($data['id']) && $value > $data['id']) {
            if (AdminGroupModel::getByPid($data['id'])) {
                $this->message['pid.notEqId'] = '禁止修改存在子类的栏目';
                return false;
            }
        }

        return true;
    }
}
