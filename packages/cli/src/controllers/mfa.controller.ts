import * as speakeasy from 'speakeasy';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Delete, Get, Post, RestController } from '@/decorators';
import { AuthenticatedRequest, MFA } from '@/requests';
import type { User } from '@db/entities/User';
import { BadRequestError } from '@/ResponseHelper';

const issuer = 'n8n';

@RestController('/mfa')
export class MFAController {
	constructor(private userRepository: Repository<User>) {}

	@Get('/qr')
	async getQRCode(req: AuthenticatedRequest) {
		const { email, id, mfaSecret, mfaRecoveryCodes, mfaEnabled } = req.user;

		if (mfaEnabled)
			throw new BadRequestError(
				'MFA already enabled. Disable it to generate new secret and recovery codes',
			);

		if (mfaSecret && mfaRecoveryCodes.length) {
			const qrCode = speakeasy.otpauthURL({
				secret: mfaSecret,
				label: email,
				encoding: 'base32',
			});
			return {
				secret: mfaSecret,
				recoveryCodes: mfaRecoveryCodes,
				qrCode,
			};
		}

		const codes = Array.from(Array(10)).map(() => uuid());

		const { base32, otpauth_url } = speakeasy.generateSecret({
			issuer,
			name: email,
			otpauth_url: true,
		});

		await this.userRepository.update(id, {
			mfaSecret: base32,
			mfaRecoveryCodes: codes,
		});

		return {
			secret: base32,
			qrCode: otpauth_url,
			recoveryCodes: codes,
		};
	}

	@Post('/enable')
	async activateMFA(req: MFA.Activate) {
		const { token } = req.body;
		const { id, mfaRecoveryCodes, mfaSecret, mfaEnabled } = req.user;

		if (mfaEnabled) throw new BadRequestError('MFA already enabled');

		if (!mfaSecret || !mfaRecoveryCodes.length) {
			throw new BadRequestError('Cannot enable MFA without generating secret and recovery codes');
		}

		const verified = speakeasy.totp.verify({ secret: mfaSecret, encoding: 'base32', token });
		if (!verified) throw new BadRequestError('MFA secret could not be verified');

		await this.userRepository.update(id, { mfaEnabled: true });
	}

	@Delete('/disable')
	async disableMFA(req: AuthenticatedRequest) {
		const { id } = req.user;
		await this.userRepository.update(id, {
			mfaEnabled: false,
			mfaSecret: null,
			mfaRecoveryCodes: [],
		});
	}

	@Post('/verify')
	async verifyMFA(req: MFA.Verify) {
		const { mfaSecret: secret } = req.user;
		const { token } = req.body;

		if (!secret) throw new BadRequestError('No MFA secret se for this user');
		const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token });
		if (!verified) throw new BadRequestError('MFA secret could not be verified');
	}
}