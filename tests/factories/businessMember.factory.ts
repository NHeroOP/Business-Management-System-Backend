import { createUser } from './user.factory.js';
import { createBusiness } from './business.factory.js';
import { BUSINESS_ROLE } from '@/consts.js';
import { BusinessMember, type IBusinessMember } from '@/modules/business-member/BusinessMember.model.js';


export const createBusinessMember = async (
  overrides: Partial<IBusinessMember> = {}
) => { 
  const userId = overrides.userId || (await createUser())._id;
  const businessId = overrides.businessId || (await createBusiness())._id;
  
  return BusinessMember.create({
    userId,
    businessId,
    role: overrides.role ?? BUSINESS_ROLE.EMPLOYEE,
    isArchived: overrides.isArchived ?? false,
  });
}